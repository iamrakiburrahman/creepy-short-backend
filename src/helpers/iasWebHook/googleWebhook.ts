import { Request, Response } from 'express';
import { google } from 'googleapis';
import { errorLogger, logger } from '../../shared/logger';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { User } from '../../app/modules/user/user.model';
import config from '../../config';
import { NotificationQueueHelper } from '../bullMQ/bullHelper';

// ==========================================
// GOOGLE WEBHOOK - Renew, Cancel, Refund
// ==========================================

const handleGoogleWebhook = async (req: Request, res: Response) => {
     try {
          const notification = req.body;
          const decodedData = Buffer.from(notification.message.data, 'base64').toString('utf-8');
          const data = JSON.parse(decodedData);

          // Test notification
          if (data.testNotification) {
               logger.info('🧪 Google Test Notification');
               return;
          }

          const subscriptionNotification = data.subscriptionNotification;
          if (!subscriptionNotification) {
               logger.error('Google webhook error: Invalid subscription notification');
               return;
          }

          const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;
          const packageName = data.packageName;

          logger.info('🤖 Google Webhook:', { type: notificationType });

          // Handle different events
          switch (notificationType) {
               case 2: // SUBSCRIPTION_RENEWED
                    await handleGoogleRenewal(packageName, subscriptionId, purchaseToken);
                    break;

               case 3: // SUBSCRIPTION_CANCELED
                    await handleGoogleCancel(purchaseToken);
                    break;

               case 13: // SUBSCRIPTION_EXPIRED
                    await handleGoogleExpired(purchaseToken);
                    break;

               case 12: // SUBSCRIPTION_REVOKED (Refund)
                    await handleGoogleRefund(purchaseToken);
                    break;
               case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
                    await handleGoogleGracePeriod(purchaseToken);
                    break;

               case 5: // SUBSCRIPTION_ON_HOLD
                    await handleGoogleOnHold(purchaseToken);
                    break;

               case 1: // SUBSCRIPTION_RECOVERED
                    await handleGoogleRecovered(packageName, subscriptionId, purchaseToken);
                    break;

               case 7: // SUBSCRIPTION_RESTARTED
                    await handleGoogleRestarted(packageName, subscriptionId, purchaseToken);
                    break;

               case 10: // SUBSCRIPTION_PAUSED
                    await handleGooglePaused(purchaseToken);
                    break;

               case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
                    logger.info('💵 Google Price Change Confirmed:', {
                         token: purchaseToken.substring(0, 20) + '...',
                    });
                    break;

               default:
                    logger.info('⚠️ Unhandled Google event:', notificationType);
          }

          res.status(200).send('OK');
     } catch (error: any) {
          errorLogger.error('Google webhook error:', error.message);
          res.status(200).send('OK');
     }
};

// Google Renewal
const handleGoogleRenewal = async (
     packageName: string,
     subscriptionId: string,
     purchaseToken: string,
) => {
     try {
          logger.info('✅ Google Renewed:', {
               packageName,
               subscriptionId,
               token: purchaseToken.substring(0, 20) + '...',
          });

          // Fetch latest data from Google Play API
          const auth = new google.auth.GoogleAuth({
               credentials: {
                    client_email: config.iap.google_play_email as string,
                    private_key: config.iap.google_play_private_key?.replace(
                         /\\n/g,
                         '\n',
                    ) as string,
               },
               scopes: ['https://www.googleapis.com/auth/androidpublisher'],
          });

          const authClient = await auth.getClient();
          const androidPublisher = google.androidpublisher('v3');

          const response = await androidPublisher.purchases.subscriptions.get({
               auth: authClient as any,
               packageName,
               subscriptionId,
               token: purchaseToken,
          });

          const expiryDate = new Date(parseInt(response.data.expiryTimeMillis || '0'));

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) {
               logger.error('❌ Subscription not found:', purchaseToken);
               return;
          }

          // Update subscription
          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.cancelAtPeriodEnd = false;
          subscription.remaining = Math.ceil(
               (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          await subscription.save();

          // Update user
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true,
          });

          // 🔔 Notification
          await NotificationQueueHelper.sendNotification(
               subscription.userId.toString(),
               'Your subscription has been successfully renewed. Enjoy uninterrupted access!',
               '✅ Subscription Renewed',
               'SYSTEM',
          );

          logger.info('✅ Google subscription renewed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google renewal:', error.message);
     }
};

// Google Cancel
const handleGoogleCancel = async (purchaseToken: string) => {
     try {
          logger.info('❌ Google Canceled:', { token: purchaseToken.substring(0, 20) + '...' });

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) return;

          subscription.cancelAtPeriodEnd = true;
          subscription.status = 'cancel';
          await subscription.save();

          // 🔔 Notification
          await NotificationQueueHelper.sendNotification(
               subscription.userId.toString(),
               'Your subscription has been canceled. You will retain access until the end of the current billing period.',
               '❌ Subscription Canceled',
               'SYSTEM',
          );

          logger.info('❌ Google subscription canceled:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google cancel:', error.message);
     }
};

// Google Expired
const handleGoogleExpired = async (purchaseToken: string) => {
     try {
          logger.info('⏰ Google Expired:', { token: purchaseToken.substring(0, 20) + '...' });

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) return;

          subscription.status = 'expired';
          await subscription.save();

          // Remove user access
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
          });

          // 🔔 Notification
          await NotificationQueueHelper.sendAlert(
               subscription.userId.toString(),
               'Your subscription has expired. Please renew to continue enjoying premium features.',
          );

          logger.info('⏰ Google subscription expired:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google expiration:', error.message);
     }
};

// Google Refund
const handleGoogleRefund = async (purchaseToken: string) => {
     try {
          logger.info('💰 Google Refund:', { token: purchaseToken.substring(0, 20) + '...' });

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) return;

          subscription.status = 'cancel';
          await subscription.save();

          // Remove user access immediately
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
          });

          // 🔔 Notification
          await NotificationQueueHelper.sendPaymentNotification(
               subscription.userId.toString(),
               'Your refund has been processed and your subscription access has been revoked.',
               purchaseToken,
               '💰 Refund Processed',
          );

          logger.info('💰 Google refund processed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google refund:', error.message);
     }
};

// Google Grace Period
const handleGoogleGracePeriod = async (purchaseToken: string) => {
     try {
          logger.info('⏱️ Google Grace Period:', { token: purchaseToken.substring(0, 20) + '...' });

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) return;

          // Mark as past_due but keep access
          subscription.status = 'past_due';
          await subscription.save();

          // 🔔 Notification
          await NotificationQueueHelper.sendAlert(
               subscription.userId.toString(),
               'We could not process your payment. You are in a grace period — please update your payment method to avoid losing access.',
          );

          logger.info('⏱️ Google subscription in grace period:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google grace period:', error.message);
     }
};

// Google On Hold (Payment completely failed, billing retry শেষ)
const handleGoogleOnHold = async (purchaseToken: string) => {
     try {
          logger.info('🔄 Google On Hold:', { token: purchaseToken.substring(0, 20) + '...' });

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) return;

          subscription.status = 'past_due';
          await subscription.save();

          // Access remove (on hold = payment failed)
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
          });

          // 🔔 Notification
          await NotificationQueueHelper.sendAlert(
               subscription.userId.toString(),
               'Your subscription is on hold due to a payment failure. Please update your payment method to restore access.',
          );

          logger.info('🔄 Google subscription on hold, access removed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google on hold:', error.message);
     }
};

// Google Recovered (Payment success after retry)
const handleGoogleRecovered = async (
     packageName: string,
     subscriptionId: string,
     purchaseToken: string,
) => {
     try {
          logger.info('🎉 Google Recovered:', {
               packageName,
               subscriptionId,
               token: purchaseToken.substring(0, 20) + '...',
          });

          // Fetch latest data from Google Play API
          const auth = new google.auth.GoogleAuth({
               credentials: {
                    client_email: config.iap.google_play_email as string,
                    private_key: config.iap.google_play_private_key?.replace(
                         /\\n/g,
                         '\n',
                    ) as string,
               },
               scopes: ['https://www.googleapis.com/auth/androidpublisher'],
          });

          const authClient = await auth.getClient();
          const androidPublisher = google.androidpublisher('v3');

          const response = await androidPublisher.purchases.subscriptions.get({
               auth: authClient as any,
               packageName,
               subscriptionId,
               token: purchaseToken,
          });

          const expiryDate = new Date(parseInt(response.data.expiryTimeMillis || '0'));

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) return;

          // Payment success, subscription recovered
          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.remaining = Math.ceil(
               (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          await subscription.save();

          // Restore user access
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true,
          });

          // 🔔 Notification
          await NotificationQueueHelper.sendNotification(
               subscription.userId.toString(),
               'Great news! Your subscription payment was successful and your access has been fully restored.',
               '🎉 Subscription Recovered',
               'SYSTEM',
          );

          logger.info('🎉 Google subscription recovered:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google recovery:', error.message);
     }
};

// Google Restarted (After pause বা cancel restart)
const handleGoogleRestarted = async (
     packageName: string,
     subscriptionId: string,
     purchaseToken: string,
) => {
     try {
          logger.info('🔄 Google Restarted:', {
               packageName,
               subscriptionId,
               token: purchaseToken.substring(0, 20) + '...',
          });

          // Fetch latest data
          const auth = new google.auth.GoogleAuth({
               credentials: {
                    client_email: config.iap.google_play_email as string,
                    private_key: config.iap.google_play_private_key?.replace(
                         /\\n/g,
                         '\n',
                    ) as string,
               },
               scopes: ['https://www.googleapis.com/auth/androidpublisher'],
          });

          const authClient = await auth.getClient();
          const androidPublisher = google.androidpublisher('v3');

          const response = await androidPublisher.purchases.subscriptions.get({
               auth: authClient as any,
               packageName,
               subscriptionId,
               token: purchaseToken,
          });

          const expiryDate = new Date(parseInt(response.data.expiryTimeMillis || '0'));

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) return;

          // Reactivate subscription
          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.cancelAtPeriodEnd = false;
          subscription.remaining = Math.ceil(
               (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          await subscription.save();

          // Restore user access
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true,
          });

          // 🔔 Notification
          await NotificationQueueHelper.sendNotification(
               subscription.userId.toString(),
               'Your subscription has been restarted successfully. Welcome back!',
               '🔄 Subscription Restarted',
               'SYSTEM',
          );

          logger.info('🔄 Google subscription restarted:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google restart:', error.message);
     }
};

// Google Paused (User temporarily paused subscription)
const handleGooglePaused = async (purchaseToken: string) => {
     try {
          logger.info('⏸️ Google Paused:', { token: purchaseToken.substring(0, 20) + '...' });

          const subscription = await Subscription.findOne({
               iapReceipt: purchaseToken,
               provider: 'google',
          });

          if (!subscription) return;

          subscription.status = 'cancel';
          await subscription.save();

          // 🔔 Notification
          await NotificationQueueHelper.sendNotification(
               subscription.userId.toString(),
               'Your subscription has been paused. You can resume it anytime from your account settings.',
               '⏸️ Subscription Paused',
               'SYSTEM',
          );

          logger.info('⏸️ Google subscription paused:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Google pause:', error.message);
     }
};

export default handleGoogleWebhook;

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { errorLogger, logger } from '../../shared/logger';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { User } from '../../app/modules/user/user.model';
import { NotificationQueueHelper } from '../bullMQ/bullHelper';


// ==========================================
// APPLE WEBHOOK - Renew, Cancel, Refund
// ==========================================

const handleAppleWebhook = async (req: Request, res: Response) => {
     try {
          const payload = req.body;
          const decodedPayload = jwt.decode(payload.signedPayload) as any;
          if (!decodedPayload) {
               logger.error('Apple webhook error: Invalid payload');
               return;
          }

          let transactionInfo: any = null;
          let renewalInfo: any = null;

          if (decodedPayload.data?.signedTransactionInfo) {
               transactionInfo = jwt.decode(decodedPayload.data.signedTransactionInfo);
          }

          if (decodedPayload.data?.signedRenewalInfo) {
               renewalInfo = jwt.decode(decodedPayload.data.signedRenewalInfo);
          }

          const notificationType = decodedPayload.notificationType;
          logger.info('📱 Apple Webhook:', { type: notificationType });
          switch (notificationType) {
               case 'DID_RENEW':
                    await handleAppleRenewal(transactionInfo);
                    break;

               case 'DID_CHANGE_RENEWAL_STATUS':
                    await handleAppleCancel(transactionInfo, renewalInfo);
                    break;

               case 'EXPIRED':
                    await handleAppleExpired(transactionInfo);
                    break;

               case 'REFUND':
                    await handleAppleRefund(transactionInfo);
                    break;

               case 'DID_FAIL_TO_RENEW':
                    await handleAppleFailedRenewal(transactionInfo);
                    break;

               case 'GRACE_PERIOD_EXPIRED':
                    await handleAppleGracePeriodExpired(transactionInfo);
                    break;

               case 'DID_RECOVER':
                    await handleAppleRecovered(transactionInfo);
                    break;

               default:
                    logger.info('⚠️ Unhandled Apple event:', notificationType);
          }

          res.status(200).send('OK');
     } catch (error: any) {
          errorLogger.error('Apple webhook error:', error.message);
          res.status(200).send('OK');
     }
};

// ==========================================
// Helper: Subscription Find
// originalTransactionId  transactionId 
// ==========================================
const findSubscription = async (transactionInfo: any) => {
     const originalTransactionId = transactionInfo?.originalTransactionId;
     const transactionId = transactionInfo?.transactionId;
     const ids = [originalTransactionId, transactionId].filter(Boolean);
     logger.info('🔍 Looking for subscription with ids:', { ids });
     const allAppleSubs = await Subscription.find({ provider: 'apple' }).select('iapReceipt userId status').limit(5);
     logger.info('🔍 Existing apple subscriptions in DB:', JSON.stringify(allAppleSubs));

     if (ids.length === 0) return null;

     return await Subscription.findOne({
          iapReceipt: { $in: ids },
          provider: 'apple',
     });
};

// ==========================================
// Apple Renewal
// ==========================================
const handleAppleRenewal = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;
          const transactionId = transactionInfo.transactionId;
          const expiryDate = new Date(transactionInfo.expiresDate);

          logger.info('✅ Apple Renewed:', {
               originalTransactionId,
               transactionId,
               newExpiry: expiryDate,
          });

          const subscription = await findSubscription(transactionInfo);

          if (!subscription) {
               logger.error('❌ Subscription not found:', { originalTransactionId, transactionId });
               return;
          }

          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.cancelAtPeriodEnd = false;
          subscription.remaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true,
               isFreeTrial: false,
          });

          await NotificationQueueHelper.sendPaymentNotification(
               subscription.userId.toString(),
               `Your subscription has been successfully renewed. You have access until ${expiryDate.toDateString()}.`,
               subscription._id.toString(),
               '✅ Subscription Renewed',
          );

          logger.info('✅ Apple subscription renewed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple renewal:', error.message);
     }
};

// ==========================================
//  Apple Cancel (Auto-renew turned off)
// ==========================================
const handleAppleCancel = async (transactionInfo: any, renewalInfo: any) => {
     try {
          const originalTransactionId = transactionInfo?.originalTransactionId;
          const transactionId = transactionInfo?.transactionId;
          const autoRenewStatus = renewalInfo?.autoRenewStatus;

          if (!originalTransactionId && !transactionId) return;

          logger.info('❌ Apple Cancel:', {
               originalTransactionId,
               transactionId,
               autoRenew: autoRenewStatus === 1 ? 'ON' : 'OFF',
          });

          const subscription = await findSubscription(transactionInfo);

          if (!subscription) {
               logger.error('❌ Subscription not found:', { originalTransactionId, transactionId });
               return;
          }

          if (autoRenewStatus === 0) {
               subscription.cancelAtPeriodEnd = true;
               subscription.status = 'cancel';
               await subscription.save();

               await NotificationQueueHelper.sendNotification(
                    subscription.userId.toString(),
                    'Your subscription has been canceled. You will still have access until the end of your current billing period.',
                    '❌ Subscription Canceled',
                    'SYSTEM',
               );

               logger.info('❌ Apple auto-renew disabled:', subscription._id);
          } else {
               subscription.cancelAtPeriodEnd = false;
               subscription.status = 'active';
               await subscription.save();

               await NotificationQueueHelper.sendNotification(
                    subscription.userId.toString(),
                    'Your subscription auto-renewal has been re-enabled. Your subscription will renew automatically.',
                    '✅ Auto-Renewal Enabled',
                    'SYSTEM',
               );

               logger.info('✅ Apple auto-renew re-enabled:', subscription._id);
          }
     } catch (error: any) {
          errorLogger.error('Error handling Apple cancel:', error.message);
     }
};

// ==========================================
//  Apple Expired
// ==========================================
const handleAppleExpired = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;
          const transactionId = transactionInfo.transactionId;

          logger.info('⏰ Apple Expired:', { originalTransactionId, transactionId });

          const subscription = await findSubscription(transactionInfo);

          if (!subscription) {
               logger.error('❌ Subscription not found:', { originalTransactionId, transactionId });
               return;
          }

          subscription.status = 'expired';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
               isFreeTrial: false,
          });

          await NotificationQueueHelper.sendNotification(
               subscription.userId.toString(),
               'Your subscription has expired. Please renew your subscription to continue enjoying premium access.',
               '⏰ Subscription Expired',
               'SYSTEM',
          );

          logger.info('⏰ Apple subscription expired:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple expiration:', error.message);
     }
};

// ==========================================
//  Apple Refund
// ==========================================
const handleAppleRefund = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;
          const transactionId = transactionInfo.transactionId;

          logger.info('💰 Apple Refund:', { originalTransactionId, transactionId });

          const subscription = await findSubscription(transactionInfo);

          if (!subscription) {
               logger.error('❌ Subscription not found:', { originalTransactionId, transactionId });
               return;
          }

          subscription.status = 'cancel';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
               isFreeTrial: false,
          });

          await NotificationQueueHelper.sendPaymentNotification(
               subscription.userId.toString(),
               'Your subscription has been refunded and your access has been revoked. If you have questions, please contact support.',
               subscription._id.toString(),
               '💰 Subscription Refunded',
          );

          logger.info('💰 Apple refund processed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple refund:', error.message);
     }
};

// ==========================================
//  Apple Failed Renewal
// ==========================================
const handleAppleFailedRenewal = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;
          const transactionId = transactionInfo.transactionId;

          logger.info('🔄 Apple Failed Renewal:', { originalTransactionId, transactionId });

          const subscription = await findSubscription(transactionInfo);

          if (!subscription) {
               logger.error('❌ Subscription not found:', { originalTransactionId, transactionId });
               return;
          }

          subscription.status = 'past_due';
          await subscription.save();

          await NotificationQueueHelper.sendAlert(
               subscription.userId.toString(),
               'We could not process your subscription payment. You are in a grace period — please update your payment method to avoid losing access.',
          );

          logger.info('🔄 Apple billing retry started:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple failed renewal:', error.message);
     }
};

// ==========================================
//  Apple Grace Period Expired
// ==========================================
const handleAppleGracePeriodExpired = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;
          const transactionId = transactionInfo.transactionId;

          logger.info('⏱️ Apple Grace Period Expired:', { originalTransactionId, transactionId });

          const subscription = await findSubscription(transactionInfo);

          if (!subscription) {
               logger.error('❌ Subscription not found:', { originalTransactionId, transactionId });
               return;
          }

          subscription.status = 'expired';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
               isFreeTrial: false,
          });

          await NotificationQueueHelper.sendAlert(
               subscription.userId.toString(),
               'Your grace period has ended and all payment retries have failed. Your subscription access has been removed. Please renew to regain access.',
          );

          logger.info('⏱️ Apple grace period ended, access removed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple grace period expiry:', error.message);
     }
};

// ==========================================
//  Apple Recovered
// ==========================================
const handleAppleRecovered = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;
          const transactionId = transactionInfo.transactionId;
          const expiryDate = new Date(transactionInfo.expiresDate);

          logger.info('🎉 Apple Recovered:', {
               originalTransactionId,
               transactionId,
               newExpiry: expiryDate,
          });

          const subscription = await findSubscription(transactionInfo);

          if (!subscription) {
               logger.error('❌ Subscription not found:', { originalTransactionId, transactionId });
               return;
          }

          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.remaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true,
               isFreeTrial: false,
          });

          await NotificationQueueHelper.sendPaymentNotification(
               subscription.userId.toString(),
               `Great news! Your payment was successful and your subscription has been restored. Access is valid until ${expiryDate.toDateString()}.`,
               subscription._id.toString(),
               '🎉 Subscription Restored',
          );

          logger.info('🎉 Apple subscription recovered:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple recovery:', error.message);
     }
};

export default handleAppleWebhook;
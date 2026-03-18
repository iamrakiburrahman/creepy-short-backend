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

          if (!payload?.signedPayload) {
               logger.error('Apple webhook error: Missing signedPayload');
               res.status(200).send('OK');
               return;
          }

          // ✅ FIX: Apple signedPayload is a 3-part JWT — decode the full token
          const decodedPayload = jwt.decode(payload.signedPayload, { complete: true }) as any;
          const payloadData = decodedPayload?.payload ?? jwt.decode(payload.signedPayload);

          if (!payloadData) {
               logger.error('Apple webhook error: Invalid payload', { raw: payload.signedPayload?.slice(0, 100) });
               res.status(200).send('OK');
               return;
          }

          let transactionInfo: any = null;
          let renewalInfo: any = null;

          if (payloadData.data?.signedTransactionInfo) {
               const decoded = jwt.decode(payloadData.data.signedTransactionInfo, { complete: true }) as any;
               transactionInfo = decoded?.payload ?? jwt.decode(payloadData.data.signedTransactionInfo);
          }

          if (payloadData.data?.signedRenewalInfo) {
               const decoded = jwt.decode(payloadData.data.signedRenewalInfo, { complete: true }) as any;
               renewalInfo = decoded?.payload ?? jwt.decode(payloadData.data.signedRenewalInfo);
          }

          // ✅ FIX: notificationType is at top-level of payloadData
          const notificationType = payloadData.notificationType;
          const subtype = payloadData.subtype;

          // ✅ DEBUG LOG: See exactly what Apple is sending
          logger.info('📱 Apple Webhook received:', {
               notificationType,
               subtype,
               environment: payloadData.data?.environment,
               bundleId: payloadData.data?.bundleId,
               originalTransactionId: transactionInfo?.originalTransactionId,
               transactionId: transactionInfo?.transactionId,
               productId: transactionInfo?.productId,
               expiresDate: transactionInfo?.expiresDate,
               autoRenewStatus: renewalInfo?.autoRenewStatus,
          });

          if (!notificationType) {
               logger.error('❌ Apple webhook: notificationType missing from payload', {
                    payloadKeys: Object.keys(payloadData),
                    dataKeys: payloadData.data ? Object.keys(payloadData.data) : [],
               });
               res.status(200).send('OK');
               return;
          }

          // Handle different events
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
                    logger.info('⚠️ Unhandled Apple event:', { notificationType, subtype });
          }

          res.status(200).send('OK');
     } catch (error: any) {
          errorLogger.error('Apple webhook error:', error.message);
          res.status(200).send('OK');
     }
};

// ==========================================
// HELPER: Find subscription by originalTransactionId
// ==========================================

/**
 * ✅ FIX: Try multiple fields to find subscription
 * because different save points may store different fields
 */
const findSubscription = async (originalTransactionId: string) => {
     if (!originalTransactionId) return null;

     // Try iapReceipt first (most common)
     let subscription = await Subscription.findOne({
          iapReceipt: originalTransactionId,
          provider: 'apple',
     });

     // Fallback: try originalTransactionId field if your schema has it
     if (!subscription) {
          subscription = await Subscription.findOne({
               originalTransactionId,
               provider: 'apple',
          });
     }

     // Fallback: try transactionId field
     if (!subscription) {
          subscription = await Subscription.findOne({
               transactionId: originalTransactionId,
               provider: 'apple',
          });
     }

     if (!subscription) {
          logger.error('❌ Subscription not found for originalTransactionId:', {
               originalTransactionId,
               // ⚠️  If this keeps failing, check what value you saved during
               // initial purchase — log your purchase handler too
          });
     }

     return subscription;
};

// ==========================================
// APPLE HANDLERS
// ==========================================

// ✅ Apple Renewal
const handleAppleRenewal = async (transactionInfo: any) => {
     try {
          if (!transactionInfo?.originalTransactionId) {
               logger.error('❌ handleAppleRenewal: missing transactionInfo');
               return;
          }

          const originalTransactionId = transactionInfo.originalTransactionId;
          const expiryDate = new Date(transactionInfo.expiresDate);

          logger.info('✅ Apple Renewed:', {
               originalTransactionId,
               newExpiry: expiryDate,
          });

          const subscription = await findSubscription(originalTransactionId);
          if (!subscription) return;

          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.cancelAtPeriodEnd = false;
          subscription.remaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true,
          });

          await NotificationQueueHelper.sendNotification(
               subscription.userId.toString(),
               'Your subscription has been successfully renewed. Enjoy uninterrupted access!',
               '✅ Subscription Renewed',
               'SYSTEM',
          );

          logger.info('✅ Apple subscription renewed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple renewal:', error.message);
     }
};

// ❌ Apple Cancel (Auto-renew turned off)
const handleAppleCancel = async (transactionInfo: any, renewalInfo: any) => {
     try {
          const originalTransactionId = transactionInfo?.originalTransactionId;
          const autoRenewStatus = renewalInfo?.autoRenewStatus;

          if (!originalTransactionId) {
               logger.error('❌ handleAppleCancel: missing originalTransactionId');
               return;
          }

          logger.info('❌ Apple Cancel:', {
               originalTransactionId,
               autoRenew: autoRenewStatus === 1 ? 'ON' : 'OFF',
          });

          const subscription = await findSubscription(originalTransactionId);
          if (!subscription) return;

          if (autoRenewStatus === 0) {
               subscription.cancelAtPeriodEnd = true;
               subscription.status = 'cancel';
               await subscription.save();

               await NotificationQueueHelper.sendNotification(
                    subscription.userId.toString(),
                    'Your subscription auto-renewal has been turned off. You will retain access until the current period ends.',
                    '❌ Auto-Renewal Disabled',
                    'SYSTEM',
               );

               logger.info('❌ Apple auto-renew disabled:', subscription._id);
          } else {
               subscription.cancelAtPeriodEnd = false;
               subscription.status = 'active';
               await subscription.save();

               await NotificationQueueHelper.sendNotification(
                    subscription.userId.toString(),
                    'Your subscription auto-renewal has been re-enabled. Your subscription will continue automatically.',
                    '✅ Auto-Renewal Enabled',
                    'SYSTEM',
               );

               logger.info('✅ Apple auto-renew re-enabled:', subscription._id);
          }
     } catch (error: any) {
          errorLogger.error('Error handling Apple cancel:', error.message);
     }
};

// ⏰ Apple Expired
const handleAppleExpired = async (transactionInfo: any) => {
     try {
          if (!transactionInfo?.originalTransactionId) {
               logger.error('❌ handleAppleExpired: missing transactionInfo');
               return;
          }

          const originalTransactionId = transactionInfo.originalTransactionId;

          logger.info('⏰ Apple Expired:', { originalTransactionId });

          const subscription = await findSubscription(originalTransactionId);
          if (!subscription) return;

          subscription.status = 'expired';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
          });

          await NotificationQueueHelper.sendAlert(subscription.userId.toString(), 'Your subscription has expired. Please renew to continue enjoying premium features.');

          logger.info('⏰ Apple subscription expired:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple expiration:', error.message);
     }
};

// 💰 Apple Refund
const handleAppleRefund = async (transactionInfo: any) => {
     try {
          if (!transactionInfo?.originalTransactionId) {
               logger.error('❌ handleAppleRefund: missing transactionInfo');
               return;
          }

          const originalTransactionId = transactionInfo.originalTransactionId;

          logger.info('💰 Apple Refund:', { originalTransactionId });

          const subscription = await findSubscription(originalTransactionId);
          if (!subscription) return;

          subscription.status = 'cancel';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
          });

          await NotificationQueueHelper.sendPaymentNotification(
               subscription.userId.toString(),
               'Your refund has been processed and your subscription access has been revoked.',
               originalTransactionId,
               '💰 Refund Processed',
          );

          logger.info('💰 Apple refund processed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple refund:', error.message);
     }
};

// 🔄 Apple Failed Renewal
const handleAppleFailedRenewal = async (transactionInfo: any) => {
     try {
          if (!transactionInfo?.originalTransactionId) {
               logger.error('❌ handleAppleFailedRenewal: missing transactionInfo');
               return;
          }

          const originalTransactionId = transactionInfo.originalTransactionId;

          logger.info('🔄 Apple Failed Renewal:', { originalTransactionId });

          const subscription = await findSubscription(originalTransactionId);
          if (!subscription) return;

          subscription.status = 'past_due';
          await subscription.save();

          await NotificationQueueHelper.sendAlert(subscription.userId.toString(), 'We were unable to renew your subscription. Please update your payment method to avoid losing access.');

          logger.info('🔄 Apple billing retry started:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple failed renewal:', error.message);
     }
};

// ⏱️ Apple Grace Period Expired
const handleAppleGracePeriodExpired = async (transactionInfo: any) => {
     try {
          if (!transactionInfo?.originalTransactionId) {
               logger.error('❌ handleAppleGracePeriodExpired: missing transactionInfo');
               return;
          }

          const originalTransactionId = transactionInfo.originalTransactionId;

          logger.info('⏱️ Apple Grace Period Expired:', { originalTransactionId });

          const subscription = await findSubscription(originalTransactionId);
          if (!subscription) return;

          subscription.status = 'expired';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
          });

          await NotificationQueueHelper.sendAlert(subscription.userId.toString(), 'Your grace period has ended and subscription access has been removed. Please renew your subscription.');

          logger.info('⏱️ Apple grace period ended, access removed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple grace period expiry:', error.message);
     }
};

// 🎉 Apple Recovered
const handleAppleRecovered = async (transactionInfo: any) => {
     try {
          if (!transactionInfo?.originalTransactionId) {
               logger.error('❌ handleAppleRecovered: missing transactionInfo');
               return;
          }

          const originalTransactionId = transactionInfo.originalTransactionId;
          const expiryDate = new Date(transactionInfo.expiresDate);

          logger.info('🎉 Apple Recovered:', {
               originalTransactionId,
               newExpiry: expiryDate,
          });

          const subscription = await findSubscription(originalTransactionId);
          if (!subscription) return;

          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.remaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true,
          });

          await NotificationQueueHelper.sendNotification(
               subscription.userId.toString(),
               'Great news! Your subscription payment was successful and your access has been fully restored.',
               '🎉 Subscription Recovered',
               'SYSTEM',
          );

          logger.info('🎉 Apple subscription recovered:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple recovery:', error.message);
     }
};

export default handleAppleWebhook;

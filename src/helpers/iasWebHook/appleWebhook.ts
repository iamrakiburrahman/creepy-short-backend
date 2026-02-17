import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { errorLogger, logger } from '../../shared/logger';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { User } from '../../app/modules/user/user.model';

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
                    logger.info('⚠️ Unhandled Apple event:', notificationType);
          }

          res.status(200).send('OK');
     } catch (error: any) {
          errorLogger.error('Apple webhook error:', error.message);
          res.status(200).send('OK');
     }
};

// ✅ Apple Renewal
const handleAppleRenewal = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;
          const expiryDate = new Date(transactionInfo.expiresDate);

          logger.info('✅ Apple Renewed:', {
               transactionId: originalTransactionId,
               newExpiry: expiryDate,
          });

          const subscription = await Subscription.findOne({
               iapReceipt: originalTransactionId,
               provider: 'apple',
          });

          if (!subscription) {
               logger.error('❌ Subscription not found:', originalTransactionId);
               return;
          }

          // Update subscription
          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.cancelAtPeriodEnd = false;
          subscription.remaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          await subscription.save();

          // Update user
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true,
          });

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

          if (!originalTransactionId) return;

          logger.info('❌ Apple Cancel:', {
               transactionId: originalTransactionId,
               autoRenew: autoRenewStatus === 1 ? 'ON' : 'OFF',
          });

          const subscription = await Subscription.findOne({
               iapReceipt: originalTransactionId,
               provider: 'apple',
          });

          if (!subscription) return;

          // If auto-renew is OFF
          if (autoRenewStatus === 0) {
               subscription.cancelAtPeriodEnd = true;
               subscription.status = 'cancel';
               await subscription.save();

               logger.info('❌ Apple auto-renew disabled:', subscription._id);
          } else {
               // If auto-renew is turned back ON
               subscription.cancelAtPeriodEnd = false;
               subscription.status = 'active';
               await subscription.save();

               logger.info('✅ Apple auto-renew re-enabled:', subscription._id);
          }
     } catch (error: any) {
          errorLogger.error('Error handling Apple cancel:', error.message);
     }
};

// ⏰ Apple Expired
const handleAppleExpired = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;

          logger.info('⏰ Apple Expired:', { transactionId: originalTransactionId });

          const subscription = await Subscription.findOne({
               iapReceipt: originalTransactionId,
               provider: 'apple',
          });

          if (!subscription) return;

          subscription.status = 'expired';
          await subscription.save();

          // Remove user access
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false
          });

          logger.info('⏰ Apple subscription expired:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple expiration:', error.message);
     }
};

// 💰 Apple Refund
const handleAppleRefund = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;

          logger.info('💰 Apple Refund:', { transactionId: originalTransactionId });

          const subscription = await Subscription.findOne({
               iapReceipt: originalTransactionId,
               provider: 'apple',
          });

          if (!subscription) return;

          subscription.status = 'cancel';
          await subscription.save();

          // Remove user access immediately
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false,
          });

          logger.info('💰 Apple refund processed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple refund:', error.message);
     }
};
// 🔄 Apple Failed Renewal (Payment failed, retry চলছে)
const handleAppleFailedRenewal = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;

          logger.info('🔄 Apple Failed Renewal:', { transactionId: originalTransactionId });

          const subscription = await Subscription.findOne({
               iapReceipt: originalTransactionId,
               provider: 'apple',
          });

          if (!subscription) return;

          // Mark as past_due but keep access (billing retry period)
          subscription.status = 'past_due';
          await subscription.save();

          logger.info('🔄 Apple billing retry started:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple failed renewal:', error.message);
     }
};

// ⏱️ Apple Grace Period Expired (Payment finally failed)
const handleAppleGracePeriodExpired = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;

          logger.info('⏱️ Apple Grace Period Expired:', { transactionId: originalTransactionId });

          const subscription = await Subscription.findOne({
               iapReceipt: originalTransactionId,
               provider: 'apple',
          });

          if (!subscription) return;

          subscription.status = 'expired';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: false,
               hasAccess: false
          });

          logger.info('⏱️ Apple grace period ended, access removed:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple grace period expiry:', error.message);
     }
};

// 🎉 Apple Recovered (Payment success after retry)
const handleAppleRecovered = async (transactionInfo: any) => {
     try {
          const originalTransactionId = transactionInfo.originalTransactionId;
          const expiryDate = new Date(transactionInfo.expiresDate);

          logger.info('🎉 Apple Recovered:', {
               transactionId: originalTransactionId,
               newExpiry: expiryDate,
          });

          const subscription = await Subscription.findOne({
               iapReceipt: originalTransactionId,
               provider: 'apple',
          });

          if (!subscription) return;

          // Payment success, subscription recovered
          subscription.currentPeriodEnd = expiryDate.toISOString();
          subscription.status = 'active';
          subscription.remaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          await subscription.save();

          // Restore user access
          await User.findByIdAndUpdate(subscription.userId, {
               isSubscribed: true,
               hasAccess: true
          });

          logger.info('🎉 Apple subscription recovered:', subscription._id);
     } catch (error: any) {
          errorLogger.error('Error handling Apple recovery:', error.message);
     }
};

export default handleAppleWebhook;

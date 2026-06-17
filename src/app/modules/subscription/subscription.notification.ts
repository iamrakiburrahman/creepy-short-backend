import AppError from '../../../errors/AppError';
import { emailHelper } from '../../../helpers/emailHelper';
import { errorLogger, logger } from '../../../shared/logger';
import { User } from '../user/user.model';
import { Subscription } from './subscription.model';

import { StatusCodes } from 'http-status-codes';

// Send trial expiry warning notification
const sendTrialExpiryWarning = async (userId: string, daysLeft: number) => {
     try {
          const user = await User.findById(userId);
          if (!user) {
               throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
          }

          const subject = `Your free trial expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
          const body = `
               Hi ${user.name || 'there'},
               
               Your free trial will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. 
               To continue enjoying our premium features, please upgrade your subscription.
               
               Upgrade now to avoid any interruption in service.
               
               Best regards,
               Yoga with Jen Team
          `;
          const data = {
               to: user.email,
               subject,
               html: body,
          };
          await emailHelper.sendEmail(data);

          logger.info(`Trial expiry warning sent to user ${user.email} - ${daysLeft} days left`);
     } catch (error: any) {
          errorLogger.error('Error sending trial expiry warning:', error.message);
     }
};

// Send subscription expiry notification
const sendSubscriptionExpiryNotification = async (userId: string) => {
     try {
          const user = await User.findById(userId);
          if (!user) {
               throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
          }

          const subject = 'Your subscription has expired';
          const body = `
               Hi ${user.name || 'there'},
               
               Your subscription has expired and you no longer have access to premium features.
               
               To restore your access, please renew your subscription.
               
               Best regards,
               Yoga with Jen Team
          `;
          const data = {
               to: user.email,
               subject,
               html: body,
          };
          await emailHelper.sendEmail(data);

          logger.info(`Subscription expiry notification sent to user ${user.email}`);
     } catch (error: any) {
          errorLogger.error('Error sending subscription expiry notification:', error.message);
     }
};

// Send auto-renewal success notification
const sendAutoRenewalSuccessNotification = async (userId: string, subscriptionId: string) => {
     try {
          const user = await User.findById(userId);
          const subscription = await Subscription.findOne({ subscriptionId }).populate('package');

          if (!user || !subscription) {
               throw new AppError(StatusCodes.NOT_FOUND, 'User or subscription not found');
          }

          const packageInfo = subscription?.package as any;
          const subject = 'Subscription renewed successfully';
          const body = `
               Hi ${user.name || 'there'},
               
               Your subscription has been automatically renewed successfully.
               
               Package: ${packageInfo?.name || 'Premium Plan'}
               Next billing date: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}
               
               Thank you for continuing with us!
               
               Best regards,
               Yoga with Jen Team
          `;
          const data = {
               to: user.email,
               subject,
               html: body,
          };
          await emailHelper.sendEmail(data);

          logger.info(`Auto-renewal success notification sent to user ${user.email}`);
     } catch (error: any) {
          errorLogger.error('Error sending auto-renewal success notification:', error.message);
     }
};

// Send payment failure notification
const sendPaymentFailureNotification = async (userId: string, reason?: string) => {
     try {
          const user = await User.findById(userId);
          if (!user) {
               throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
          }

          const subject = 'Payment failed - Action required';
          const body = `
               Hi ${user.name || 'there'},
               
               We were unable to process your subscription payment.
               ${reason ? `Reason: ${reason}` : ''}
               
               Please update your payment method to avoid service interruption.
               
               Best regards,
               Yoga with Jen Team
          `;

          const data = {
               to: user.email,
               subject,
               html: body,
          };
          await emailHelper.sendEmail(data);

          logger.info(`Payment failure notification sent to user ${user.email}`);
     } catch (error: any) {
          errorLogger.error('Error sending payment failure notification:', error.message);
     }
};

// Check and send trial expiry warnings (run daily)
const checkAndSendTrialWarnings = async () => {
     try {
          const now = new Date();
          const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

          // Find users whose trial expires in 3 days
          const usersExpiring3Days = await User.find({
               isFreeTrial: true,
               trialExpireAt: {
                    $gte: now,
                    $lte: threeDaysFromNow,
               },
          });

          // Find users whose trial expires in 1 day
          const usersExpiring1Day = await User.find({
               isFreeTrial: true,
               trialExpireAt: {
                    $gte: now,
                    $lte: oneDayFromNow,
               },
          });

          // Send 3-day warnings
          for (const user of usersExpiring3Days) {
               await sendTrialExpiryWarning(user._id.toString(), 3);
          }

          // Send 1-day warnings
          for (const user of usersExpiring1Day) {
               await sendTrialExpiryWarning(user._id.toString(), 1);
          }

          logger.info(
               `Trial warning check completed: ${usersExpiring3Days.length} users notified (3 days), ${usersExpiring1Day.length} users notified (1 day)`,
          );
     } catch (error: any) {
          errorLogger.error('Error checking trial warnings:', error.message);
     }
};

export const SubscriptionNotificationService = {
     sendTrialExpiryWarning,
     sendSubscriptionExpiryNotification,
     sendAutoRenewalSuccessNotification,
     sendPaymentFailureNotification,
     checkAndSendTrialWarnings,
};

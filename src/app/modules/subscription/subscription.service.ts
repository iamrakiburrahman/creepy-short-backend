import { Package } from '../package/package.model';
import { ISubscription } from './subscription.interface';
import { Subscription } from './subscription.model';
import { User } from '../user/user.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { errorLogger } from '../../../shared/logger';
import { validateAppleReceipt, validateGoogleReceipt } from './iap.service';
import { createCacheHelper } from '../../builder/RedisCacheHelper';
import { NotificationQueueHelper } from '../../../helpers/bullMQ/bullHelper';
const userCache = createCacheHelper('user');
const subscriptionDetailsFromDB = async (
     id: string,
): Promise<{ subscription: ISubscription | object }> => {
     const subscription = await Subscription.findOne({ userId: id, status: 'active' })
          .populate('package', 'title credit duration')
          .lean();

     if (!subscription) {
          return { subscription: {} };
     }
     return { subscription };
};

const subscriptionsFromDB = async (query: Record<string, unknown>): Promise<ISubscription[]> => {
     const conditions: any[] = [];
     const { searchTerm, limit, page, paymentType } = query;
     if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
          const trimmedSearchTerm = searchTerm.trim();
          const matchingPackageIds = await Package.find({
               $or: [
                    { title: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { paymentType: { $regex: trimmedSearchTerm, $options: 'i' } },
               ],
          }).distinct('_id');
          const matchingUserIds = await User.find({
               $or: [
                    { email: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { name: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { company: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { contact: { $regex: trimmedSearchTerm, $options: 'i' } },
               ],
          }).distinct('_id');
          const searchConditions = [];

          if (matchingPackageIds.length > 0) {
               searchConditions.push({ package: { $in: matchingPackageIds } });
          }

          if (matchingUserIds.length > 0) {
               searchConditions.push({ userId: { $in: matchingUserIds } });
          }
          if (searchConditions.length > 0) {
               conditions.push({ $or: searchConditions });
          } else {
               return {
                    data: [],
                    meta: {
                         page: parseInt(page as string) || 1,
                         total: 0,
                    },
               } as any;
          }
     }

     // Handle payment type filter
     if (paymentType && typeof paymentType === 'string' && paymentType.trim()) {
          const packageIdsWithPaymentType = await Package.find({
               paymentType: paymentType.trim(),
          }).distinct('_id');

          if (packageIdsWithPaymentType.length > 0) {
               conditions.push({ package: { $in: packageIdsWithPaymentType } });
          } else {
               // If no packages match the payment type, return empty result
               return {
                    data: [],
                    meta: {
                         page: parseInt(page as string) || 1,
                         total: 0,
                    },
               } as any;
          }
     }

     // Build final query conditions
     const whereConditions = conditions.length > 0 ? { $and: conditions } : {};

     // Pagination
     const pages = Math.max(1, parseInt(page as string) || 1);
     const size = Math.max(1, Math.min(100, parseInt(limit as string) || 10)); // Limit max size
     const skip = (pages - 1) * size;

     try {
          // Execute query with population
          const result = await Subscription.find(whereConditions)
               .populate([
                    {
                         path: 'package',
                         select: 'title paymentType credit description',
                    },
                    {
                         path: 'userId',
                         select: 'email name contact company',
                    },
               ])
               .select(
                    'userId package price trxId currentPeriodStart currentPeriodEnd status createdAt updatedAt',
               )
               .sort({ createdAt: -1 }) // Add sorting by creation date
               .skip(skip)
               .limit(size)
               .lean(); // Use lean() for better performance

          // Get total count for pagination
          const count = await Subscription.countDocuments(whereConditions);

          const data: any = {
               data: result,
               meta: {
                    page: pages,
                    limit: size,
                    total: count,
                    totalPages: Math.ceil(count / size),
               },
          };

          return data;
     } catch (error) {
          errorLogger.error('Error fetching subscriptions:', error);
          throw new Error('Failed to fetch subscriptions');
     }
};

const checkSubscriptionAccess = async (userId: string) => {
     const user = await User.findById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
     const hasAccess = user.hasAccess;

     return {
          hasAccess,
          isSubscribed: user.isSubscribed,
     };
};

// Get user transaction history
const getTransactionHistory = async (userId: string): Promise<any> => {
     try {
          const transactions = await Subscription.find({ userId })
               .populate('package', 'title paymentType credit duration')
               .select(
                    'package price trxId currentPeriodStart currentPeriodEnd status createdAt trialStart trialEnd',
               )
               .sort({ createdAt: -1 })
               .lean();

          const formattedTransactions = transactions.map((transaction: any) => ({
               id: transaction._id,
               packageName: transaction.package?.title || 'Unknown Package',
               paymentType: transaction.package?.paymentType || 'Unknown',
               amount: transaction.price || 0,
               transactionId: transaction.trxId,
               subscriptionPeriod: {
                    start: transaction.currentPeriodStart,
                    end: transaction.currentPeriodEnd,
               },
               status: transaction.status,
               isTrialPeriod: transaction.trialStart && transaction.trialEnd ? true : false,
               trialPeriod:
                    transaction.trialStart && transaction.trialEnd
                         ? {
                                start: transaction.trialStart,
                                end: transaction.trialEnd,
                           }
                         : null,
               createdAt: transaction.createdAt,
          }));

          return {
               transactions: formattedTransactions,
               totalTransactions: formattedTransactions.length,
          };
     } catch (error: any) {
          throw new AppError(
               StatusCodes.INTERNAL_SERVER_ERROR,
               `Failed to fetch transaction history: ${error.message}`,
          );
     }
};
const createIAPSubscription = async (
     userId: string,
     payload: {
          provider: 'google' | 'apple';
          productId: string;
          purchaseToken: string;
          price: number;
          packageName?: string;
     },
) => {
     // 1. Find User
     const user = await User.findById(userId);
     if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

     let validation;
     let targetPackage;
     const targetPackageName = payload.packageName || '';

     // 2. Validate Receipt & Fetch Package
     if (payload.provider === 'google') {
          if (!targetPackageName) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Package Name is required for Google');
          }
          validation = await validateGoogleReceipt(
               payload.purchaseToken,
               payload.productId,
               targetPackageName,
          );
          targetPackage = await Package.findOne({
               googleProductId: payload.productId,
          }).select('title duration price');
     } else {
          validation = await validateAppleReceipt(payload.purchaseToken);
          targetPackage = await Package.findOne({
               appleProductId: payload.productId,
          }).select('title duration price');
     }

     // 3. Validation Check
     if (!validation.isValid || !validation.newExpiryDate) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid or Expired Subscription Receipt');
     }

     if (!targetPackage) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package configuration not found');
     }

     // ✅ Apple হলে originalTransactionId ব্যবহার করো, না হলে purchaseToken
     const iapReceipt =
          payload.provider === 'apple' && validation.originalTransactionId
               ? validation.originalTransactionId
               : payload.purchaseToken;

     // 4. Check for Duplicate Purchase (fix করা হয়েছে — সঠিক receipt দিয়ে check)
     const existingSub = await Subscription.findOne({ iapReceipt });
     if (existingSub) {
          throw new AppError(StatusCodes.CONFLICT, 'Subscription already exists with this receipt');
     }

     const currentPeriodStart = new Date();
     const currentPeriodEnd = validation.newExpiryDate;
     const isTrial = validation.isTrial;

     const remainingDays = isTrial
          ? 7
          : Math.ceil(
                 (currentPeriodEnd.getTime() - currentPeriodStart.getTime()) /
                      (1000 * 60 * 60 * 24),
            );

     const status = isTrial ? 'trialing' : 'active';

     // 7. Create Subscription
     const newSub = await Subscription.create({
          name: targetPackage?.name || 'Unknown Package',
          provider: payload.provider,
          userId: user._id,
          package: targetPackage?._id, // ✅ Use package ObjectId
          price: payload.price,

          // Identifiers
          subscriptionId: validation.productId || payload.productId, // ✅ Use validated productId
          iapProductId: payload.productId,
          iapReceipt: payload.purchaseToken,
          packageName: targetPackageName,

          // Dates
          currentPeriodStart: currentPeriodStart.toISOString(),
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          remaining: remainingDays, // ✅ Calculated dynamically

          // Status
          status: status,
     });

     if (!newSub)
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create subscription');
     // 8. Update User Access
     await User.findByIdAndUpdate(
          userId,
          {
               hasAccess: true,
               isSubscribed: true,
               subscription: newSub._id,
          },
          { new: true },
     );
     await userCache.clearAfterUpdate(userId);
     if (isTrial) {
          await NotificationQueueHelper.sendNotification(
               userId,
               `Your free trial for "${targetPackage?.name}" has started! You have 7 days of full access.`,
               '🎉 Free Trial Started',
               'SYSTEM',
          );
     } else {
          await NotificationQueueHelper.sendPaymentNotification(
               userId,
               `Your subscription to "${targetPackage?.name}" is now active. Enjoy premium access for ${remainingDays} days!`,
               newSub._id.toString(),
               '✅ Subscription Activated',
          );
     }
     return newSub;
};
export const SubscriptionService = {
     subscriptionDetailsFromDB,
     subscriptionsFromDB,
     getTransactionHistory,
     createIAPSubscription,
     checkSubscriptionAccess,
};

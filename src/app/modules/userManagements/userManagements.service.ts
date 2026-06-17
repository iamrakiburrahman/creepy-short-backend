import { StatusCodes } from 'http-status-codes';
import { USER_ROLES } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import { logger } from '../../../shared/logger';
import { EmailQueueHelper } from '../../../helpers/bullMQ/bullHelper';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import { Subscription } from '../subscription/subscription.model';

const userCache = createCacheHelper('user');
const allUser = async (query: Record<string, unknown>) => {
     return await userCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(
                    User.find({ role: USER_ROLES.USER }).lean(),
                    query,
               );

               const users = await queryBuilder
                    .search(['name', 'phone', 'email', 'address'])
                    .filter()
                    .sort()
                    .paginate()
                    .fields()
                    .modelQuery.exec();

               const meta = await queryBuilder.countTotal();

               // Fetch active subscriptions for all users in one query
               const userIds = users.map((user: any) => user._id);

               const activeSubscriptions = await Subscription.find({
                    userId: { $in: userIds },
                    status: 'active',
               })
                    .select(
                         'userId subscriptionId package packageName currentPeriodStart currentPeriodEnd remaining provider price',
                    )
                    .lean();

               // Map subscriptions by userId for O(1) lookup
               const subscriptionMap = new Map(
                    activeSubscriptions.map((sub) => [sub.userId.toString(), sub]),
               );

               // Map through users and format watch time + attach subscription
               const formattedUsers = users.map((user: any) => {
                    const totalSeconds = user.totalWatchTime || 0;
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;

                    const activeSubscription = subscriptionMap.get(user._id.toString()) || null;

                    return {
                         ...user,
                         watchTimeDetails: {
                              totalSeconds,
                              formatted: `${hours}h ${minutes}m ${seconds}s`,
                              breakdown: { hours, minutes, seconds },
                         },
                         activeSubscription,
                    };
               });

               return { users: formattedUsers, meta };
          },
          CACHE_TTL.SHORT,
     );
};

// ✅ Wrap single item
const singleUser = async (id: string) => {
     return await userCache.wrapSingle(
          id,
          async () => {
               // Your EXACT SAME code
               const result = await User.findById(id);
               if (!result) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
               }
               const totalSeconds = result.totalWatchTime || 0;
               const hours = Math.floor(totalSeconds / 3600);
               const minutes = Math.floor((totalSeconds % 3600) / 60);
               const seconds = totalSeconds % 60;
               return {
                    ...result,
                    watchTimeDetails: {
                         totalSeconds,
                         formatted: `${hours}h ${minutes}m ${seconds}s`,
                         breakdown: { hours, minutes, seconds },
                    },
               };
          },
          CACHE_TTL.MEDIUM,
     );
};

// ✅ Just add ONE line for cache clearing
const updateUserStatus = async (id: string, status: string) => {
     // Your EXACT SAME update code
     const result = await User.findByIdAndUpdate(id, { $set: { status } }, { new: true });

     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
     }

     // ✅ Just add this ONE line - clears all related caches
     await userCache.clearAfterUpdate(id);

     // Your EXACT SAME email logic
     if (status === 'blocked') {
          try {
               await EmailQueueHelper.blockAccountEmail(result.email, result.name);
               logger.info('Block account email sent successfully', { email: result.email });
          } catch (err: any) {
               logger.error('Failed to send block account email', {
                    error: err.message,
                    email: result.email,
               });
               throw new AppError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Failed to send block account email',
               );
          }
     }

     return result;
};

const deleteUser = async (id: string) => {
     // Your EXACT SAME delete code
     const result = await User.findByIdAndDelete(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
     }
     // ✅ Just add this ONE line - clears all related caches
     await userCache.clearAfterUpdate(id);
     return result;
};

export const DashboardUserService = {
     allUser,
     singleUser,
     updateUserStatus,
     deleteUser,
};

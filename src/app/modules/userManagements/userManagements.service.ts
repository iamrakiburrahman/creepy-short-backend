import { StatusCodes } from "http-status-codes";
import { USER_ROLES } from "../../../enums/user";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { User } from "../user/user.model";
import { logger } from "../../../shared/logger";
import { EmailQueueHelper } from "../../../helpers/bullMQ/bullHelper";
import { CACHE_TTL, createCacheHelper } from "../../builder/RedisCacheHelper";

const userCache = createCacheHelper('user');
const allUser = async (query: Record<string, unknown>) => {
  return await userCache.wrapList(query, async () => {
    const queryBuilder = new QueryBuilder(
      User.find({ role: USER_ROLES.USER }),
      query
    );

    const users = await queryBuilder
      .search(['firstName', 'lastName', "phone", 'email', 'address'])
      .filter()
      .sort()
      .paginate()
      .fields()
      .modelQuery.exec();
    const meta = await queryBuilder.countTotal();
    return { users, meta };
  }, CACHE_TTL.SHORT);
};

// ✅ Wrap single item
const singleUser = async (id: string) => {
  return await userCache.wrapSingle(id, async () => {
    // Your EXACT SAME code
    const result = await User.findById(id);
    if (!result) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
    }
    return result;
  }, CACHE_TTL.MEDIUM);
};

// ✅ Just add ONE line for cache clearing
const updateUserStatus = async (id: string, status: string) => {
  // Your EXACT SAME update code
  const result = await User.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true },
  );
  
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
        email: result.email 
      });
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR, 
        'Failed to send block account email'
      );
    }
  }

  return result;
};

export const DashboardUserService = {
  allUser,
  singleUser,
  updateUserStatus
};
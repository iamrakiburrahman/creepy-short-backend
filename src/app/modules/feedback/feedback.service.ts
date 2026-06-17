import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import IFeedback from './feedback.interface';
import { Feedback } from './feedback.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
const feedBackCache = createCacheHelper('feedbackCache');
const createFeedback = async (userId: string, payload: IFeedback) => {
     const isExistUser = await User.findById(userId);
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'User not found');
     }
     payload.userId = isExistUser._id;
     const result = await Feedback.create(payload);
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create feedback');
     }
     await feedBackCache.clearLists();
     return result;
};

const getFeedbacks = async (query: Record<string, unknown>) => {
     return await feedBackCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(Feedback.find(), query);
               const result = await queryBuilder
                    .paginate()
                    .sort()
                    .fields()
                    .modelQuery.populate('userId', 'name image')
                    .exec();
               const meta = await queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.VERY_LONG,
     );
};
const deleteFeedback = async (feedbackId: string) => {
     const result = await Feedback.findByIdAndDelete(feedbackId);
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete feedback');
     }
     await feedBackCache.clearAfterUpdate(feedbackId);
     return result;
};
const deleteAllFeedbacks = async () => {
     const result = await Feedback.deleteMany({});
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete all feedbacks');
     }
     await feedBackCache.clearLists();
     return result;
};

export const FeedbackService = {
     createFeedback,
     getFeedbacks,
     deleteFeedback,
     deleteAllFeedbacks,
};

import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { IReminder } from './reminder.interface';
import { ReminderModel } from './reminder.model';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
const createReminderCache = createCacheHelper('reminderCache');
const createReminderToDB = async (userId: string, payload: IReminder) => {
     const result = await ReminderModel.create({ ...payload, userId });
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create reminder');
     }
     await createReminderCache.clearLists();
     return result;
};

const getAllRemindersFromDB = async (query: Record<string, unknown>) => {
     return await createReminderCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(ReminderModel.find(), query);
               const result = await queryBuilder.filter().fields().paginate().sort().modelQuery.exec();
               const meta = await queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.VERY_LONG,
     );
};
const getAllRemindersForUserFromDB = async (query: Record<string, unknown>) => {
     return await createReminderCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(ReminderModel.find({ status: 'active' }), query);
               const result = await queryBuilder.filter().fields().paginate().sort().modelQuery.exec();
               const meta = await queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.VERY_LONG,
     );
};

const getReminderFromDB = async (id: string) => {
     return await createReminderCache.wrapSingle(
          id,
          async () => {
               return await ReminderModel.findById(id).populate('userId');
          },
          CACHE_TTL.VERY_LONG,
     );
};

const updateReminderFromDB = async (id: string, payload: IReminder) => {
     const result = await ReminderModel.findByIdAndUpdate(id, payload, { new: true });
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update reminder');
     }
     await createReminderCache.clearAfterUpdate(id);
     return result;
};

const deleteReminderFromDB = async (id: string) => {
     const result = await ReminderModel.findByIdAndDelete(id);
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete reminder');
     }
     await createReminderCache.clearAfterUpdate(id);
     return result;
};

export const ReminderService = {
     createReminderToDB,
     getAllRemindersFromDB,
     getReminderFromDB,
     updateReminderFromDB,
     deleteReminderFromDB,
     getAllRemindersForUserFromDB,
};

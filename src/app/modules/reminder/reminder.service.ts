import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { IReminder } from './reminder.interface';
import { ReminderModel } from './reminder.model';

const createReminderToDB = async (userId: string, payload: IReminder) => {
     const result = await ReminderModel.create({ ...payload, userId });
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create reminder');
     }
     return result;
};

const getAllRemindersFromDB = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(ReminderModel.find(), query);
     const result = await queryBuilder.filter().fields().paginate().sort().modelQuery.exec();
     const meta = await queryBuilder.countTotal();
     return {
          meta,
          result,
     };
};

const getReminderFromDB = async (id: string) => {
     return await ReminderModel.findById(id).populate('userId');
};

const updateReminderFromDB = async (id: string, payload: IReminder) => {
     return await ReminderModel.findByIdAndUpdate(id, payload, { new: true }).populate('userId');
};

const deleteReminderFromDB = async (id: string) => {
     return await ReminderModel.findByIdAndDelete(id);
};

export const ReminderService = {
     createReminderToDB,
     getAllRemindersFromDB,
     getReminderFromDB,
     updateReminderFromDB,
     deleteReminderFromDB,
};

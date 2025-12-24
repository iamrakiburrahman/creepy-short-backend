import { StatusCodes } from 'http-status-codes';
import { ReminderService } from './reminder.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
export const createReminder = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await ReminderService.createReminderToDB(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'Reminder created successfully',
          data: result,
     });
});
export const getAllRemindersFromDB = catchAsync(async (req, res) => {
     const result = await ReminderService.getAllRemindersFromDB(req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Reminders retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});
export const getReminderFromDB = catchAsync(async (req, res) => {
     const result = await ReminderService.getReminderFromDB(req.params.id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Reminder retrieved successfully',
          data: result,
     });
});
export const updateReminderFromDB = catchAsync(async (req, res) => {
     const result = await ReminderService.updateReminderFromDB(req.params.id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Reminder updated successfully',
          data: result,
     });
});
export const deleteReminderFromDB = catchAsync(async (req, res) => {
     const result = await ReminderService.deleteReminderFromDB(req.params.id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Reminder deleted successfully',
          data: result,
     });
});
export const ReminderController = {
     createReminder,
     getAllRemindersFromDB,
     getReminderFromDB,
     updateReminderFromDB,
     deleteReminderFromDB,
};

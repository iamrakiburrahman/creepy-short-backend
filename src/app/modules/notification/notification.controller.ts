import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';

const getNotificationFromDB = catchAsync(async (req, res) => {
     const user: any = req.user;
     const result = await NotificationService.getNotificationFromDB(user, req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notifications Retrieved Successfully',
          data: {
               result: result.result,
               unreadCount: result?.unreadCount,
          },
          meta: result?.meta,
     });
});

const adminNotificationFromDB = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationService.adminNotificationFromDB(id, req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notifications Retrieved Successfully',
          data: result?.result,
          meta: result?.meta,
     });
});

const readAllNotification = catchAsync(async (req, res) => {
     const user: any = req.user;
     const result = await NotificationService.readAllNotificationToDB(user);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Read Successfully',
          data: result,
     });
});

const readSingleNotification = catchAsync(async (req, res) => {
     const { notificationId } = req.params;
     const result = await NotificationService.readSingleNotificationToDB(notificationId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Read Successfully',
          data: result,
     });
});

const fakeNotification = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationService.fakeNotificationToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Created Successfully',
          data: result,
     });
});

const deleteNotification = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await NotificationService.deleteNotificationToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Deleted Successfully',
          data: result,
     });
});

const deleteAllNotification = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationService.deleteAllNotificationToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'All Notifications Deleted Successfully',
          data: result,
     });
});

export const NotificationController = {
     adminNotificationFromDB,
     getNotificationFromDB,
     readAllNotification,
     readSingleNotification,
     fakeNotification,
     deleteNotification,
     deleteAllNotification,
};

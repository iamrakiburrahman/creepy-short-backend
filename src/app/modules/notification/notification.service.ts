import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enums/user';
import { EmailQueueHelper, NotificationQueueHelper } from '../../../helpers/bullMQ/bullHelper';

// get notifications
const getNotificationFromDB = async (user: JwtPayload, query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Notification.find({ receiver: user.id }).populate('receiver', 'name email image'), query);
     const result = await queryBuilder.filter().sort().paginate().fields().modelQuery.exec();
     const meta = await queryBuilder.countTotal();
     const unreadCount = await Notification.countDocuments({
          receiver: user.id,
          read: false,
          status: 'RECEIVED',
     });
     const data: any = {
          result,
          meta,
          unreadCount,
     };
     return data;
};

// read notifications only for user
const readAllNotificationToDB = async (user: JwtPayload): Promise<INotification | undefined> => {
     const result: any = await Notification.updateMany({ receiver: user.id, read: false }, { $set: { read: true } });
     return result;
};

// get notifications for admin
const adminNotificationFromDB = async (userId: string, query: Record<string, unknown>) => {
     const user = await User.findById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
     }
     if (user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN) {
          const queryBuilder = new QueryBuilder(Notification.find({ receiver: user.id }), query).filter().sort().paginate().fields();
          const result = await queryBuilder.modelQuery.exec();
          const meta = await queryBuilder.countTotal();
          return {
               result,
               meta,
          };
     }
};

// read notifications only for admin
const readSingleNotificationToDB = async (notificationId: string): Promise<INotification | null> => {
     const result: any = await Notification.findByIdAndUpdate(
          notificationId,
          { $set: { read: true } },
          {
               new: true,
               runValidators: true,
          },
     );
     return result;
};

 const fakeNotificationToDB = async (userId: string) => {
     if (!userId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'User ID is required');
     }
     const uniqueSuffix = Date.now();

     const title = `TEST_NOTIFICATION ${uniqueSuffix}`;
     const message = 'This is a test notification';

     const result = await NotificationQueueHelper.sendNotification(userId, message, title, 'ALERT');

     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to send test notification');
     }
     return {
          success: true,
          notificationId: result || null,
     };
};

export const NotificationService = {
     adminNotificationFromDB,
     getNotificationFromDB,
     readAllNotificationToDB,
     readSingleNotificationToDB,
     fakeNotificationToDB,
};

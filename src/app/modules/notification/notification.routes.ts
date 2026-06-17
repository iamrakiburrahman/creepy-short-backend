import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
import auth from '../../middleware/auth';
const router = express.Router();

router.get('/', auth(USER_ROLES.USER), NotificationController.getNotificationFromDB);
router.get(
     '/admin',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     NotificationController.adminNotificationFromDB,
);
router.patch('/', auth(USER_ROLES.USER), NotificationController.readAllNotification);
router.patch(
     '/:notificationId/read',
     auth(USER_ROLES.USER),
     NotificationController.readSingleNotification,
);
router.post('/fake', auth(USER_ROLES.USER), NotificationController.fakeNotification);
router.delete(
     '/clear-all',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     NotificationController.deleteAllNotification,
);
router.delete(
     '/single/:id/delete',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     NotificationController.deleteNotification,
);

export const NotificationRoutes = router;

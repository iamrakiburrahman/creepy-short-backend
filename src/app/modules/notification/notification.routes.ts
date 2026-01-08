import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
import auth from '../../middleware/auth';
const router = express.Router();

router.get('/', auth(USER_ROLES.USER), NotificationController.getNotificationFromDB);
router.get('/admin', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), NotificationController.adminNotificationFromDB);
router.patch('/', auth(USER_ROLES.USER), NotificationController.readAllNotification);
router.patch('/:notificationId', auth(USER_ROLES.USER), NotificationController.readSingleNotification);


export const NotificationRoutes = router;

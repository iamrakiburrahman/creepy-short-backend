import express from 'express';
import { ReminderController } from './reminder.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
const router = express.Router();

router.post(
     '/create',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     fileUploadHandler(),
     parseFileData({ fieldName: FOLDER_NAMES.THUMBNAIL, forceSingle: true }),
     ReminderController.createReminder,
);
router.get(
     '/',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     ReminderController.getAllRemindersFromDB,
);
router.get('/for-user', auth(USER_ROLES.USER), ReminderController.getAllRemindersForUserFromDB);
router.get(
     '/get-single/:id',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
     ReminderController.getReminderFromDB,
);
router.put(
     '/update/:id',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     fileUploadHandler(),
     parseFileData({ fieldName: FOLDER_NAMES.THUMBNAIL, forceSingle: true }),
     ReminderController.updateReminderFromDB,
);
router.delete(
     '/delete/:id',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     ReminderController.deleteReminderFromDB,
);

export const ReminderRoute = router;

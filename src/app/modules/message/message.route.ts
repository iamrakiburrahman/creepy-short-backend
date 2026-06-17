import express from 'express';
import { MessageController } from './message.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseMultipleFileData from '../../middleware/parseMultipleFiledata';
import { FOLDER_NAMES } from '../../../enums/files';
import parseFileData from '../../middleware/parseFileData';

const router = express.Router();

// Existing routes
router.post(
     '/send-message/:chatId',
     fileUploadHandler(),
     parseFileData(FOLDER_NAMES.IMAGES),
     auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     MessageController.sendMessage,
);
// Reply to a message
router.post(
     '/:chatId/reply/:messageId',
     fileUploadHandler(),
     auth(USER_ROLES.USER),
     parseFileData(FOLDER_NAMES.IMAGES),
     MessageController.replyToMessage,
);
router.get(
     '/:chatId',
     auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     MessageController.getMessages,
);

router.post(
     '/react/:messageId',
     auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     MessageController.addReaction,
);

router.delete(
     '/delete/:messageId',
     auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     MessageController.deleteMessage,
);

// New route for pin/unpin message
router.patch(
     '/pin-unpin/:messageId',
     auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     MessageController.pinUnpinMessage,
);

export const MessageRoutes = router;

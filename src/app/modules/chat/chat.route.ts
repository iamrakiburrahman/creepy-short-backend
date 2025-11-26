import { Router } from 'express';
import { ChatController } from './chat.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';

const router = Router();

// Existing routes
router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), ChatController.getChats);
router.post('/create', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), ChatController.createChat);
router.patch('/mark-chat-as-read/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), ChatController.markChatAsRead);
router.patch('/mark-chat-as-read-icon', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), ChatController.markMessagesAsIconViewed);
router.delete('/delete/:chatId', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), ChatController.deleteChat);

// New routes for additional features
router.patch('/mute-unmute/:chatId', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), ChatController.muteUnmuteChat);
router.patch('/block-unblock/:chatId/:targetUserId', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), ChatController.blockUnblockUser);

export const ChatRoutes = router;

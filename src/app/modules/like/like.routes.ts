import express from 'express';
import { LikeController } from './like.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth'; 

const router = express.Router();

// Route to toggle a bookmark (add/remove)
router.post('/toggle', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), LikeController.toggleLike);

// Route to delete a bookmark for the authenticated user
router.delete('/removed/:videoId', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), LikeController.deleteLike);

export const LikeRoutes = router;

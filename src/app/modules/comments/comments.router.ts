import express from 'express';
import { CommentsController } from './comments.controller';
import validateRequest from '../../middleware/validateRequest';
import { CommentValidationSchema } from './comments.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
const router = express.Router();

// Define routes
router.post(
     '/comment',
     auth(USER_ROLES.USER),
     validateRequest(CommentValidationSchema.createCommentSchema),
     CommentsController.createComment,
);
router.get('/comments/:postId', auth(USER_ROLES.USER), CommentsController.getComments);
router.post('/like/:commentId', auth(USER_ROLES.USER), CommentsController.likeComment);
router.post('/reply/:commentId', auth(USER_ROLES.USER), CommentsController.replyToComment);

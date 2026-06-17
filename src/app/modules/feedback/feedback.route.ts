import express from 'express';
import { FeedbackValidation } from './feedback.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { FeedbackController } from './feedback.controller';
import validateRequest from '../../middleware/validateRequest';
const router = express.Router();

router
     .route('/create')
     .post(
          auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
          validateRequest(FeedbackValidation.createFeedbackZodSchema),
          FeedbackController.createFeedback,
     );
router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), FeedbackController.getFeedbacks);
router.delete(
     '/delete-all',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     FeedbackController.deleteAllFeedbacks,
);
router.delete(
     '/:id',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     FeedbackController.deleteFeedback,
);

export const FeedbackRoutes = router;

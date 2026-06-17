import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
import { authLimiter } from '../../../DB/security';
import authOptional from '../../middleware/authOptional';
const router = express.Router();

router
     .route('/profile')
     .get(
          auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
          UserController.getUserProfile,
     )
     .patch(
          auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
          fileUploadHandler(),
          parseFileData(FOLDER_NAMES.IMAGE),
          validateRequest(UserValidation.updateUserZodSchema),
          UserController.updateProfile,
     );

router
     .route('/register')
     .post(
          authLimiter,
          validateRequest(UserValidation.createUserZodSchema),
          UserController.createUser,
     );
router.get(
     '/recently-viewed',
     authOptional(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
     UserController.getRecentlyViewedVideosByUser,
);
router.post(
     '/add-recently-viewed/:videoId',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
     UserController.addRecentlyViewedVideos,
);
router.delete(
     '/delete-account',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
     UserController.deleteProfile,
);

// Admin routes for user management
router
     .route('/admin')
     .post(
          auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
          validateRequest(UserValidation.createUserZodSchema),
          UserController.createAdmin,
     );

// User search and management routes
router
     .route('/find/id/:id')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.findUserById);

router
     .route('/find/email/:email')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.findUserByEmail);

router
     .route('/find/google/:googleId')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.findUserByGoogleId);

router
     .route('/find/facebook/:facebookId')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.findUserByFacebookId);

router
     .route('/all')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.getAllUsers);

router
     .route('/role/:role')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.getUsersByRole);

router
     .route('/oauth')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.getOAuthUsers);

router
     .route('/local')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.getLocalUsers);

router
     .route('/search')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.searchUsers);

router
     .route('/stats')
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.getUserStats);

router
     .route('/:userId/link-oauth')
     .post(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.linkOAuthAccount);

router
     .route('/:userId/unlink-oauth')
     .post(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.unlinkOAuthAccount);

export const UserRouter = router;

import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { authLimiter } from '../../../DB/security';
const router = express.Router();

router.post('/login', authLimiter, validateRequest(AuthValidation.createLoginZodSchema), AuthController.loginUser);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forget-password', authLimiter, validateRequest(AuthValidation.createForgetPasswordZodSchema), AuthController.forgetPassword);

router.post('/verify-email', validateRequest(AuthValidation.createVerifyEmailZodSchema), AuthController.verifyEmail);
router.post('/reset-password', validateRequest(AuthValidation.createResetPasswordZodSchema), AuthController.resetPassword);
router.post('/dashboard/forget-password', validateRequest(AuthValidation.createForgetPasswordZodSchema), AuthController.forgetPasswordByUrl);

router.post('/dashboard/reset-password', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), validateRequest(AuthValidation.createResetPasswordZodSchema), AuthController.resetPasswordByUrl);

router.post('/change-password', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), validateRequest(AuthValidation.createChangePasswordZodSchema), AuthController.changePassword);
router.post('/resend-otp', AuthController.resendOtp);

// OAuth Routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleAuthCallback);
router.get('/facebook', AuthController.facebookAuth);
router.get('/facebook/callback', AuthController.facebookAuthCallback);

export const AuthRouter = router;

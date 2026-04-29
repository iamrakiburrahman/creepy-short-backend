import express from 'express';
import { AdManagementController } from './adManagement.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import authOptional from '../../middleware/authOptional';

const router = express.Router();

router.get('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), AdManagementController.getAllAdds);
router.get('/all-adds', authOptional(USER_ROLES.USER), AdManagementController.getAllAdds);
router.get('/add-for-user/:id', authOptional(USER_ROLES.USER), AdManagementController.getSingleAddForUser);
router.get('/random-ad', AdManagementController.getRandomAd);

router.get('/single/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), AdManagementController.getSingleAdd);
// Save video metadata
router.post('/create', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), AdManagementController.createAdd);

router.patch('/update/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), AdManagementController.updateAdd);

router.delete('/delete/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), AdManagementController.deleteAdd);

// Generate upload URL for video
router.post('/generate-upload-url', AdManagementController.generateUploadUrl);

export const AdManagementRoutes = router;

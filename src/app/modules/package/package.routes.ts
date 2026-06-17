import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { PackageController } from './package.controller';
import { PackageValidation } from './package.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';

const router = express.Router();

router
     .route('/')
     .post(
          auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
          validateRequest(PackageValidation.createPackageZodSchema),
          PackageController.createPackage,
     )
     .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), PackageController.getPackage);

router.get('/users-package', auth(USER_ROLES.USER), PackageController.getPackageByUser);
router
     .route('/:id')
     .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), PackageController.updatePackage)
     .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), PackageController.deletePackage);

export const PackageRoutes = router;

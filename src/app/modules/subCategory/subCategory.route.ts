import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import authOptional from '../../middleware/authOptional';
import validateRequest from '../../middleware/validateRequest';
import { SubCategoryController } from './subCategory.controller';
import { SubCategoryValidation } from './subCategory.validation';
const router = express.Router();

router.post(
     '/create',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     validateRequest(SubCategoryValidation.createSubCategoryZodSchema),
     SubCategoryController.createSubCategory,
);

router.get(
     '/',
     authOptional(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
     SubCategoryController.getSubCategories,
);
router
     .route('/:id')
     .delete(
          auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
          SubCategoryController.deleteSubCategory,
     );

export const SubCategoryRoutes = router;

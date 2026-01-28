// routes/dynamicContent.routes.ts
import { Router } from 'express';
import { DynamicContentController } from './dynamicContent.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';

const router = Router();

router.post('/upload', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGE), DynamicContentController.createOrUpdate);
router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), DynamicContentController.getAll);

// public route 
router.get('/key/:key', DynamicContentController.getByKey);
router.get('/category/:category', DynamicContentController.getByCategory);
router.delete('/:key', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), DynamicContentController.deleteContent);

export const DynamicContentRoutes = router;

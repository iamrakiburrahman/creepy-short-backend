import express from 'express';
import { TrailerController } from './adManagement.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { uploadThumbnail } from '../../middleware/multer';

const router = express.Router();

router.get('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.getAllTrailers);
router.get('/all-trailers', auth(USER_ROLES.USER), TrailerController.getAllTrailers);
router.get('/trailer-for-user/:id', auth(USER_ROLES.USER), TrailerController.getSingleTrailerForUser);
router.get('/single/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.getSingleTrailer);
// Save video metadata
router.post('/create', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.createTrailer);

router.patch('/update/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.updateTrailer);

router.delete('/delete/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.deleteTrailer);

// Generate upload URL for video
router.post('/generate-upload-url', TrailerController.generateUploadUrl);
// Upload thumbnail for a video
router.post('/:videoId/thumbnail', uploadThumbnail, TrailerController.uploadThumbnail);

export const TrailerRoutes = router;

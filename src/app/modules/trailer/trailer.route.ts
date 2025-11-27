import express from 'express';
import { TrailerController } from './trailer.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { uploadThumbnail } from '../../middleware/multer';

const router = express.Router();

router.get('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.getAllTrailers);

router.get('/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.getSingleTrailer);

router.post('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.createTrailer);

router.patch('/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.updateTrailer);

router.delete('/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), TrailerController.deleteTrailer);

// Generate upload URL for video
router.post('/generate-upload-url', TrailerController.generateUploadUrl);

// Upload thumbnail for a video
router.post('/:videoId/thumbnail', uploadThumbnail, TrailerController.uploadThumbnail);

// Save video metadata
router.post('/metadata', TrailerController.saveVideoMetadata);
export const TrailerRoutes = router;

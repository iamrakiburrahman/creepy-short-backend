import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import authOptional from '../../middleware/authOptional';
import { uploadThumbnail } from '../../middleware/multer';
import { VideoManagementController } from './videoManagement.controller';

const router = express.Router();

router.get('/get-all-videos/:seasonId', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), VideoManagementController.getAllVideos);
router.get('/single/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), VideoManagementController.getSingleVideo);
// Save video metadata
router.post('/create', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), VideoManagementController.createVideo);
router.patch('/update/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), VideoManagementController.updateVideo);
router.delete('/delete/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), VideoManagementController.deleteVideo);
// Generate upload URL for video
router.post('/generate-upload-url', VideoManagementController.generateUploadUrl);
// Upload thumbnail for a video
router.post('/:videoId/thumbnail', uploadThumbnail, VideoManagementController.uploadThumbnail);
// Generate share URL for a video
router.get('/generate-share-url/:videoId', authOptional(), VideoManagementController.generateShareVideoUrl);

// Waiting for video to be processed

router.get('/single-video-for-user/:id', authOptional(USER_ROLES.USER), VideoManagementController.getSingleVideo);
router.get('/all-season-videos-by/:seasonId', authOptional(USER_ROLES.USER), VideoManagementController.getSeasonVideos);
router.get('/shorts-videos', authOptional(USER_ROLES.USER), VideoManagementController.getSortVideos);

export const VideoManagementRoutes = router;

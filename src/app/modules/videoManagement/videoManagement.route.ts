import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
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
router.get('/single-video-for-user/:id', auth(USER_ROLES.USER), VideoManagementController.getSingleVideo);
router.get('/all-season-videos-by/:seasonId', auth(USER_ROLES.USER), VideoManagementController.getSeasonVideos);
router.get('/sort-videos', auth(USER_ROLES.USER), VideoManagementController.getSortVideos);

export const VideoManagementRoutes = router;


import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { VideoManagementServices } from './videoManagement.service';

const updateVideo = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await VideoManagementServices.updateVideo(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Video updated successfully',
          data: result,
     });
});

const getSingleVideo = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await VideoManagementServices.getSingleVideo(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Video retrieved successfully',
          data: result,
     });
});

const getAllVideos = catchAsync(async (req, res) => {
     const result = await VideoManagementServices.getAllVideos(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Videos retrieved successfully',
          data: result,
     });
});

const deleteVideo = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await VideoManagementServices.deleteVideo(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Video deleted successfully',
          data: result,
     });
});
const generateUploadUrl = catchAsync(async (req, res) => {
     const result = await VideoManagementServices.generateUploadUrl(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Upload URL generated successfully',
          data: result,
     });
});

const uploadThumbnail = catchAsync(async (req, res) => {
     const { videoId } = req.params;
     const { thumbnailUrl } = req.body;

     const result = await VideoManagementServices.uploadThumbnail(videoId, thumbnailUrl);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Thumbnail uploaded successfully',
          data: { result },
     });
});

const createVideo = catchAsync(async (req, res) => {
     const { id: userId } = req.user as { id: string }; // Assuming you have auth middleware that sets req.user

     const result = await VideoManagementServices.createVideo(userId, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Video created successfully',
          data: result,
     });
});

export const VideoManagementController = {
     updateVideo,
     getSingleVideo,
     getAllVideos,
     deleteVideo,
     generateUploadUrl,
     uploadThumbnail,
     createVideo,
};

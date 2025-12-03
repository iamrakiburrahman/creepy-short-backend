import { TrailerServices } from './trailer.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';

const updateTrailer = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await TrailerServices.updateTrailer(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Trailer updated successfully',
          data: result,
     });
});

const getSingleTrailer = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await TrailerServices.getSingleTrailer(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Trailer retrieved successfully',
          data: result,
     });
});

const getAllTrailers = catchAsync(async (req, res) => {
     const result = await TrailerServices.getAllTrailers(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Trailers retrieved successfully',
          data: result,
     });
});

const deleteTrailer = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await TrailerServices.deleteTrailer(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Trailer deleted successfully',
          data: result,
     });
});
const generateUploadUrl = catchAsync(async (req, res) => {
     const result = await TrailerServices.generateUploadUrl(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Upload URL generated successfully',
          data: result,
     });
});

const uploadThumbnail = catchAsync(async (req, res) => {
     const file = req.file;
     if (!file) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'No file uploaded');
     }
     const { videoId } = req.params;
     const result = await TrailerServices.uploadThumbnail(videoId, file);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Thumbnail uploaded successfully',
          data: { result },
     });
});

const createTrailer = catchAsync(async (req, res) => {
     const { id: userId } = req.user as { id: string }; // Assuming you have auth middleware that sets req.user

     const result = await TrailerServices.createTrailer(userId, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Trailer created successfully',
          data: result,
     });
});

export const TrailerController = {
     updateTrailer,
     getSingleTrailer,
     getAllTrailers,
     deleteTrailer,
     generateUploadUrl,
     uploadThumbnail,
     createTrailer,
};

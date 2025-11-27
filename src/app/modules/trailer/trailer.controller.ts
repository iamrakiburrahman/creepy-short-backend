import { TrailerServices } from './trailer.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';

const createTrailer = catchAsync(async (req, res) => {
     const trailerData = req.body;

     const result = await TrailerServices.createTrailer(req.user!, trailerData);

     sendResponse(res, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'Trailer created successfully',
          data: result,
     });
});

const updateTrailer = catchAsync(async (req, res) => {
     const { id } = req.params;
     const trailerData = req.body;

     const result = await TrailerServices.updateTrailer(id, trailerData);

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
     const { id } = req.user as { id: string };
     const result = await TrailerServices.getAllTrailers(id);

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
     const { videoId } = req.params;
     const { thumbnailUrl } = req.body;

     const result = await TrailerServices.uploadThumbnail(videoId, thumbnailUrl);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Thumbnail uploaded successfully',
          data: { result },
     });
});

const saveVideoMetadata = catchAsync(async (req, res) => {
     const { id: userId } = req.user as { id: string }; // Assuming you have auth middleware that sets req.user

     const result = await TrailerServices.saveVideoMetadata(userId, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Video metadata saved successfully',
          data: result,
     });
});

export const TrailerController = {
     createTrailer,
     updateTrailer,
     getSingleTrailer,
     getAllTrailers,
     deleteTrailer,
};

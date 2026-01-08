import { AdManagementServices } from './adManagement.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const updateAdd = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await AdManagementServices.updateAdd(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Add updated successfully',
          data: result,
     });
});

const getSingleAdd = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await AdManagementServices.getSingleAdd(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Add retrieved successfully',
          data: result,
     });
});

const getRandomAd = catchAsync(async (req, res) => {
     const result = await AdManagementServices.getRandomAd();
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Ad retrieved successfully',
          data: result,
     });
});
const getSingleAddForUser = catchAsync(async (req, res) => {
     const { id } = req.params;
     const { id: userId } = req.user as { id: string };
     const result = await AdManagementServices.getSingleAddForUser(id, userId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Add retrieved successfully',
          data: result,
     });
});

const getAllAdds = catchAsync(async (req, res) => {
     const result = await AdManagementServices.getAllAdds(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Adds retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

const deleteAdd = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await AdManagementServices.deleteAdd(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Add deleted successfully',
          data: result,
     });
});
const generateUploadUrl = catchAsync(async (req, res) => {
     const result = await AdManagementServices.generateUploadUrl(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Upload URL generated successfully',
          data: result,
     });
});


const createAdd = catchAsync(async (req, res) => {
     const { id: userId } = req.user as { id: string }; // Assuming you have auth middleware that sets req.user

     const result = await AdManagementServices.createAdd(userId, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Add created successfully',
          data: result,
     });
});

export const AdManagementController = {
     updateAdd,
     getSingleAdd,
     getAllAdds,
     deleteAdd,
     generateUploadUrl,
     createAdd,
     getSingleAddForUser,     
     getRandomAd,
};

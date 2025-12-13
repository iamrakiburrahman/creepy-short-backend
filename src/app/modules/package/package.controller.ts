import catchAsync from '../../../shared/catchAsync';
import { PackageService } from './package.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createPackage = catchAsync(async (req, res) => {
     const result = await PackageService.createPackageToDB(req.body);

     sendResponse(res, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'Package created Successfully',
          data: result,
     });
});

const updatePackage = catchAsync(async (req, res) => {
     const result = await PackageService.updatePackageToDB(req.params.id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Package updated Successfully',
          data: result,
     });
});

const getPackage = catchAsync(async (req, res) => {
     const result = await PackageService.getPackageFromDB(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Package Retrieved Successfully',
          data: result.packages,
          meta: result.meta,
     });
});
const getPackageByUser = catchAsync(async (req, res) => {
     const result = await PackageService.getPackageByUserFromDB(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Package Retrieved Successfully',
          data: result.packages,
          meta: result.meta,
     });
});

const packageDetails = catchAsync(async (req, res) => {
     const result = await PackageService.getPackageDetailsFromDB(req.params.id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Package Details Retrieved Successfully',
          data: result,
     });
});

const deletePackage = catchAsync(async (req, res) => {
     const result = await PackageService.deletePackageToDB(req.params.id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Package Deleted Successfully',
          data: result,
     });
});

export const PackageController = {
     createPackage,
     updatePackage,
     getPackage,
     packageDetails,
     deletePackage,
     getPackageByUser,
};

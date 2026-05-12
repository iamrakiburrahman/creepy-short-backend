
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DashboardUserService } from './userManagements.service';

const getAllUser = catchAsync(async (req, res) => {
  const result = await DashboardUserService.allUser(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result.users,
    meta: result.meta,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const result = await DashboardUserService.singleUser(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User retrieved successful',
    data: result,
  });
});

const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const result = await DashboardUserService.updateUserStatus(
    req.params.id,
    status,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User status update successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await DashboardUserService.deleteUser(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});



export const DashboardUserController = {
  getAllUser,
  getSingleUser,
  updateStatus,
  deleteUser
};

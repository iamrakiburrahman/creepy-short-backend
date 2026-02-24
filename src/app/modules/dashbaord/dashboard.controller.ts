// dashboard.controller.ts
import { StatusCodes } from 'http-status-codes';
import { DashboardService } from './dashboard.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';


const overview = catchAsync(async (req, res) => {
     const data = await DashboardService.getOverview();
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Dashboard overview retrieved',
          data,
     });
});

const userGrowth = catchAsync(async (req, res) => {
     const data = await DashboardService.getUserGrowth();
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User growth retrieved',
          data,
     });
});

const topWatched = catchAsync(async (req, res) => {
     const data = await DashboardService.getTopWatchedVideos();
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Top watched content retrieved',
          data,
     });
});

export const DashboardController = {
     overview,
     userGrowth,
     topWatched,
};

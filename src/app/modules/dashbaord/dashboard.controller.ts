// dashboard.controller.ts
import { StatusCodes } from 'http-status-codes';
import { DashboardService } from './dashboard.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const overview = catchAsync(async (req, res) => {
     const data = await DashboardService.getOverview(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Dashboard overview retrieved',
          data,
     });
});

const userGrowth = catchAsync(async (req, res) => {
     const { year = new Date().getFullYear() } = req.query;
     const data = await DashboardService.getUserGrowth(Number(year));
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: `User growth retrieved for ${year}`,
          data,
     });
});

const topWatched = catchAsync(async (req, res) => {
     const { year = new Date().getFullYear() } = req.query;
     const data = await DashboardService.getTopWatchedVideos(Number(year));
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: `Top watched content retrieved for ${year}`,
          data,
     });
});
const getProductionReport = catchAsync(async (req, res) => {
     const { year = new Date().getFullYear() } = req.query;
     const data = await DashboardService.getProductionReportStats(Number(year));

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: `Production analytics retrieved for ${year}`,
          data,
     });
});
export const DashboardController = {
     overview,
     userGrowth,
     topWatched,
     getProductionReport,
};

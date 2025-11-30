import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SeasonService } from './sessionManagement.service';
import { MovieService } from '../movieManagement/movieManagement.service';

const createSeason = catchAsync(async (req, res) => {
     const result = await SeasonService.createSeasonToDB(req.body);

     sendResponse(res, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'Season created successfully',
          data: result,
     });
});

const getAllSeasonsFromDB = catchAsync(async (req, res) => {
     const result = await SeasonService.getAllSeasonsFromDB(req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Seasons retrieved successfully',
          data: result,
     });
});

const getSeasonFromDB = catchAsync(async (req, res) => {
     const result = await SeasonService.getSeasonFromDB(req.params.id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Season retrieved successfully',
          data: result,
     });
});

const updateSeasonFromDB = catchAsync(async (req, res) => {
     const result = await SeasonService.updateSeasonFromDB(req.params.id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Season updated successfully',
          data: result,
     });
});

const deleteSeasonFromDB = catchAsync(async (req, res) => {
     const result = await SeasonService.deleteSeasonFromDB(req.params.id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Season deleted successfully',
          data: result,
     });
});

export const SeasonController = {
     createSeason,
     getAllSeasonsFromDB,
     getSeasonFromDB,
     updateSeasonFromDB,
     deleteSeasonFromDB,
};

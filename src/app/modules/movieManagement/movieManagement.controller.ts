import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { MovieService } from './movieManagement.service';

const createMovie = catchAsync(async (req, res) => {
     const result = await MovieService.createMovieToDB(req.body);

     sendResponse(res, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'Movie created successfully',
          data: result,
     });
});

const getAllMoviesFromDB = catchAsync(async (req, res) => {
     const result = await MovieService.getAllMoviesFromDB(req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Movies retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

const getMovieFromDB = catchAsync(async (req, res) => {
     const result = await MovieService.getMovieFromDB(req.params.id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Movie retrieved successfully',
          data: result,
     });
});

const updateMovieFromDB = catchAsync(async (req, res) => {
     const result = await MovieService.updateMovieFromDB(req.params.id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Movie updated successfully',
          data: result,
     });
});

const deleteMovieFromDB = catchAsync(async (req, res) => {
     const result = await MovieService.deleteMovieFromDB(req.params.id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Movie deleted successfully',
          data: result,
     });
});

const getAllMoviesForUser = catchAsync(async (req, res) => {
     const result = await MovieService.getAllMoviesForUser(req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Movies retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

const getNewReleaseMovies = catchAsync(async (req, res) => {
     const result = await MovieService.getNewReleaseMovies(req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Movies retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

export const MovieController = {
     createMovie,
     getAllMoviesFromDB,
     getMovieFromDB,
     updateMovieFromDB,
     deleteMovieFromDB,
     getAllMoviesForUser,
     getNewReleaseMovies,
};

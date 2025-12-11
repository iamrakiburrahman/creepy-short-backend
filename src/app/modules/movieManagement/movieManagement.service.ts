import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import { IMovie } from './movieManagement.interface';
import { MovieModel } from './movieManagement.model';
import unlinkFile from '../../../shared/unlinkFile';
import { Category } from '../category/category.model';
const movieCache = createCacheHelper('movieCache');

const createMovieToDB = async (payload: IMovie) => {

     const category = await Category.findById(payload.categoryId);
     if (!category) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Category not found');
     }
     payload.category = category.name;
     const result = await MovieModel.create(payload);
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Movie not created');
     }
     await movieCache.clearLists();
     return result;
};

const getAllMoviesFromDB = async (query: Record<string, unknown>) => {
     return await movieCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(MovieModel.find(), query);
               const result = await queryBuilder.fields().paginate().sort().filter().search(['title']).modelQuery.exec();
               const meta = await queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.VERY_LONG,
     );
};

const getMovieFromDB = async (id: string) => {
     return await movieCache.wrapSingle(
          id,
          async () => {
               const result = await MovieModel.findById(id);
               if (!result) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
               }
               return result;
          },
          CACHE_TTL.VERY_LONG,
     );
};

const updateMovieFromDB = async (id: string, payload: IMovie) => {
     const existingMovie = await MovieModel.findById(id);
     if (!existingMovie) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
     }
     if (payload.thumbnail && existingMovie.thumbnail) {
          unlinkFile(existingMovie.thumbnail);
     }
     const result = await MovieModel.findByIdAndUpdate(id, payload, { new: true });
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
     }
     await movieCache.clearAfterUpdate(id);
     return result;
};

const deleteMovieFromDB = async (id: string) => {
     const result = await MovieModel.findByIdAndDelete(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
     }
     await movieCache.clearAfterUpdate(id);
     return result;
};

const getAllMoviesForUser = async (query: Record<string, unknown>) => {
     return await movieCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(MovieModel.find(), query);
               const result = await queryBuilder.fields().paginate().sort().filter().search(['title']).modelQuery.exec();
               const meta = await queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.VERY_LONG,
     );
};

const getNewReleaseMovies = async (query: Record<string, unknown>) => {
     return await movieCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(MovieModel.find({ isReleased: true }).sort({ releaseDate: -1 }), query);
               const result = await queryBuilder.fields().paginate().sort().filter().search(['title']).modelQuery.exec();
               const meta = await queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.VERY_LONG,
     );
};

export const MovieService = {
     createMovieToDB,
     getAllMoviesFromDB,
     getMovieFromDB,
     updateMovieFromDB,
     deleteMovieFromDB,
     getAllMoviesForUser,
     getNewReleaseMovies,
};

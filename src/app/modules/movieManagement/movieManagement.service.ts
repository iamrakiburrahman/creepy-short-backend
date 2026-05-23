import { StatusCodes } from 'http-status-codes';
import { USER_ROLES } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import { NotificationQueueHelper } from '../../../helpers/bullMQ/bullHelper';
import unlinkFile from '../../../shared/unlinkFile';
import { getDateRange } from '../../../utils/getDateRange';
import QueryBuilder from '../../builder/QueryBuilder';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import { Category } from '../category/category.model';
import { SeasonModel } from '../seasonManagement/seasonManagement.model';
import { User } from '../user/user.model';
import { Video } from '../videoManagement/videoManagement.model';
import { IMovie } from './movieManagement.interface';
import { MovieModel } from './movieManagement.model';
import { buildCategoryFilter, buildMeta, getFieldsParam, getPaginationParams, getSortParam, TMovieQuery } from './movieManagement.helper';
const movieCache = createCacheHelper('movieCache');

const createMovieToDB = async (payload: IMovie) => {
     const categories = await Category.find({ _id: { $in: payload.categoryIds } });
     if (!categories.length) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'No categories found');
     }
     payload.categories = categories.map((cat) => cat.name);
     payload.category = categories[0].name;
     payload.categoryId = categories[0]._id;
     console.log(payload);
     const result = await MovieModel.create(payload);
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Movie not created');
     }

     await movieCache.clearAll();

     await NotificationQueueHelper.sendBroadcastNotification(
          payload.title ? `New movie just added: "${payload.title}". Watch it now!` : 'A new movie has just been added. Check it out!',
          '🎬 New Movie Available',
          'ADMIN',
     );

     return result;
};

const getAllMoviesFromDB = async (query: TMovieQuery) => {
     return await movieCache.wrapList(
          query,
          async () => {
               const { page, limit, skip } = getPaginationParams(query);
               const sort = getSortParam(query);
               const fields = getFieldsParam(query);
               const categoryFilter = buildCategoryFilter(query);

               const filter: Record<string, unknown> = {
                    isDeleted: false,
                    ...categoryFilter,
               };

               if (query.searchTerm) {
                    filter.title = { $regex: query.searchTerm, $options: 'i' };
               }

               const [result, total] = await Promise.all([
                    MovieModel.find(filter)
                         .sort(sort)
                         .skip(skip)
                         .limit(limit)
                         .select(fields ?? {}),
                    MovieModel.countDocuments(filter),
               ]);

               return { meta: buildMeta(page, limit, total), result };
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
const getSingleMovieFromDBWithUser = async (id: string, userId?: string) => {
     // Check user only if userId is provided
     let isUser = null;
     if (userId) {
          isUser = await User.findById(userId);
          // If a token was provided but user doesn't exist in DB, throw error
          if (!userId && !isUser) {
               throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
          }
     }

     const result = await MovieModel.findById(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
     }

     // Increment views if it's a guest OR a regular user (not an admin)
     // This ensures views are counted even for guest mood
     if (!isUser || isUser.role === USER_ROLES.USER) {
          await MovieModel.findByIdAndUpdate(id, { $inc: { totalViews: 1 } }, { timestamps: false });
          await movieCache.clearAfterUpdate(id);
     }

     return result;
};

const updateMovieFromDB = async (id: string, payload: IMovie) => {
     const existingMovie = await MovieModel.findById(id);
     if (!existingMovie) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
     }
     if (payload.thumbnail && existingMovie.thumbnail) {
          unlinkFile(existingMovie.thumbnail);
     }
     if (payload.categoryIds && payload.categoryIds.length) {
          const categories = await Category.find({ _id: { $in: payload.categoryId } });
          if (!categories.length) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'No categories found');
          }
          payload.categories = categories.map((cat) => cat.name);
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
     await Video.deleteMany({ movieId: id });
     await movieCache.clearAfterUpdate(id);
     return result;
};

const getAllMoviesForUser = async (query: TMovieQuery) => {
     return await movieCache.wrapList(
          query,
          async () => {
               const { page, limit, skip } = getPaginationParams(query);
               const sort = getSortParam(query);
               const fields = getFieldsParam(query);
               const categoryFilter = buildCategoryFilter(query);

               const filter: Record<string, unknown> = {
                    isDeleted: false,
                    ...categoryFilter,
               };

               if (query.searchTerm) {
                    filter.title = { $regex: query.searchTerm, $options: 'i' };
               }

               const [result, total] = await Promise.all([
                    MovieModel.find(filter)
                         .sort(sort)
                         .skip(skip)
                         .limit(limit)
                         .select(fields ?? {}),
                    MovieModel.countDocuments(filter),
               ]);

               return { meta: buildMeta(page, limit, total), result };
          },
          CACHE_TTL.VERY_LONG,
     );
};

const getNewReleaseMovies = async (query: TMovieQuery) => {
     return await movieCache.wrapList(
          query,
          async () => {
               const { page, limit, skip } = getPaginationParams(query);
               const fields = getFieldsParam(query);
               const categoryFilter = buildCategoryFilter(query);

               const filter: Record<string, unknown> = {
                    isDeleted: false,
                    isReleased: true,
                    ...categoryFilter,
               };

               if (query.searchTerm) {
                    filter.title = { $regex: query.searchTerm, $options: 'i' };
               }

               const [result, total] = await Promise.all([
                    MovieModel.find(filter)
                         .sort({ releaseDate: -1 })
                         .skip(skip)
                         .limit(limit)
                         .select(fields ?? {}),
                    MovieModel.countDocuments(filter),
               ]);

               return { meta: buildMeta(page, limit, total), result };
          },
          CACHE_TTL.VERY_LONG,
     );
};

const mostPopular = async (query: TMovieQuery) => {
     const { page, limit, skip } = getPaginationParams(query);
     const fields = getFieldsParam(query);
     const categoryFilter = buildCategoryFilter(query);

     const filter: Record<string, unknown> = {
          isDeleted: false,
          isReleased: true,
          ...categoryFilter,
     };

     if (query.searchTerm) {
          filter.title = { $regex: query.searchTerm, $options: 'i' };
     }

     const [result, total] = await Promise.all([
          MovieModel.find(filter)
               .sort({ totalViews: -1 })
               .skip(skip)
               .limit(limit)
               .select(fields ?? {}),
          MovieModel.countDocuments(filter),
     ]);

     return { meta: buildMeta(page, limit, total), result };
};

const getAllMoviesForUserWithDateFilter = async (query: TMovieQuery) => {
     const { page, limit, skip } = getPaginationParams(query);
     const sort = getSortParam(query);
     const fields = getFieldsParam(query);
     const categoryFilter = buildCategoryFilter(query);

     const filter: Record<string, unknown> = {
          isDeleted: false,
          ...categoryFilter,
     };

     if (query.filter && ['today', 'week', 'month'].includes(query.filter)) {
          filter.releaseDate = getDateRange(query.filter);
     }

     if (query.searchTerm) {
          filter.title = { $regex: query.searchTerm, $options: 'i' };
     }

     const [result, total] = await Promise.all([
          MovieModel.find(filter)
               .sort(sort)
               .skip(skip)
               .limit(limit)
               .select(fields ?? {}),
          MovieModel.countDocuments(filter),
     ]);

     return { meta: buildMeta(page, limit, total), result };
};

const getSingleMovieFromDBWithSession = async (userId: string | undefined, id: string) => {
     let isUser = null;

     if (userId) {
          isUser = await User.findById(userId);
     }

     const movie = await MovieModel.findById(id);
     if (!movie) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
     }
     if (!isUser || isUser.role === USER_ROLES.USER) {
          await MovieModel.findByIdAndUpdate(id, { $inc: { totalViews: 1 } }, { timestamps: false });
          await movieCache.clearAfterUpdate(id);
     }

     const seasons = await SeasonModel.find({ movieId: id }).sort({
          seasonNumber: 1,
     });

     const seasonsWithVideos = seasons.map((season) => ({
          seasonId: season._id,
          seasonNumber: season.seasonNumber,
          seasonTitle: season.title,
     }));

     return {
          movie: movie,
          seasons: seasonsWithVideos,
          totalSeasons: seasons.length,
     };
};
export const MovieService = {
     createMovieToDB,
     getAllMoviesFromDB,
     getMovieFromDB,
     updateMovieFromDB,
     deleteMovieFromDB,
     getAllMoviesForUser,
     getNewReleaseMovies,
     getSingleMovieFromDBWithUser,
     mostPopular,
     getAllMoviesForUserWithDateFilter,
     getSingleMovieFromDBWithSession,
};

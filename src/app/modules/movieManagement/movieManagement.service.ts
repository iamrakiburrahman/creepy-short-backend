import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import { IMovie } from './movieManagement.interface';
import { MovieModel } from './movieManagement.model';
import unlinkFile from '../../../shared/unlinkFile';
import { Category } from '../category/category.model';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enums/user';
import { getDateRange } from '../../../utils/getDateRange';
import { SeasonModel } from '../seasonManagement/seasonManagement.model';
import { Video } from '../videoManagement/videoManagement.model';
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
const getSingleMovieFromDBWithUser = async (userId: string, id: string) => {
     const isUser = await User.findById(userId);
     if (!isUser) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     const result = await MovieModel.findById(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
     }
     if (isUser.role === USER_ROLES.USER) {
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
               const result = await queryBuilder.fields().paginate().sort().filter().search(['title']).dateFilter('releaseDate').modelQuery.exec();
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
const mostPopuler = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(MovieModel.find({ isReleased: true }).sort({ totalViews: -1 }), query);
     const result = await queryBuilder.fields().paginate().sort().filter().search(['title']).modelQuery.exec();
     const meta = await queryBuilder.countTotal();
     return {
          meta,
          result,
     };
};

const getAllMoviesForUserWithDateFilter = async (query: Record<string, unknown>) => {
     const filter = query?.filter as 'today' | 'week' | 'month';

     // Base query
     const baseQuery: any = {};
     if (filter && ['today', 'week', 'month'].includes(filter)) {
          baseQuery.releaseDate = getDateRange(filter || 'today');
     }

     const queryBuilder = new QueryBuilder(MovieModel.find(baseQuery), query);

     const result = await queryBuilder.fields().paginate().sort().filter().search(['title']).modelQuery.exec();

     const meta = await queryBuilder.countTotal();
     return { meta, result };
};
const getSingleMovieFromDBWithSession = async (userId: string, id: string) => {
     const isUser = await User.findById(userId);
     if (!isUser) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     const movie = await MovieModel.findById(id);
     if (!movie) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Movie not found');
     }

     // User role হলে view count বাড়াবে
     if (isUser.role === USER_ROLES.USER) {
          await MovieModel.findByIdAndUpdate(id, { $inc: { totalViews: 1 } }, { timestamps: false });
          await movieCache.clearAfterUpdate(id);
     }

     // Movie এর সব seasons fetch করা
     const seasons = await SeasonModel.find({ movieId: id }).sort({ seasonNumber: 1 });

     // প্রতিটি season এর video count সহ data তৈরি করা
     const seasonsWithVideos = await Promise.all(
          seasons.map(async (season) => {
               const videos = await Video.find({ seasonId: season._id }).sort({ videoNumber: 1 });

               return {
                    seasonId: season._id,
                    seasonNumber: season.seasonNumber,
                    seasonTitle: season.title,
                    totalVideos: videos.length,
                    videoRange: videos.length > 0 ? `${videos[0].episodeNumber}-${videos[videos.length - 1].episodeNumber}` : '0-0',
                    videos: videos.map((v) => ({
                         videoId: v._id,
                         episodeNumber: v.episodeNumber,
                         title: v.title,
                         duration: v.duration,
                         videoUrl: v.videoUrl,
                    })),
               };
          }),
     );

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
     mostPopuler,
     getAllMoviesForUserWithDateFilter,
     getSingleMovieFromDBWithSession
};

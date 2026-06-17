import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import { ISeason } from './seasonManagement.interface';
import { SeasonModel } from './seasonManagement.model';
import { NotificationQueueHelper } from '../../../helpers/bullMQ/bullHelper';
const seasonCache = createCacheHelper('seasonCache');

const createSeasonToDB = async (payload: ISeason) => {
     const result = await SeasonModel.create(payload);
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Season not created');
     }

     await seasonCache.clearLists();

     // 🔔 Broadcast notification to all users — new season added
     await NotificationQueueHelper.sendBroadcastNotification(
          payload.title
               ? `New season just added: "${payload.title}". Watch it now!`
               : 'A new season has just been added. Check it out!',
          '🎬 New Season Available',
          'ADMIN',
     );

     return result;
};

const getAllSeasonsFromDB = async (query: Record<string, unknown>) => {
     return await seasonCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(SeasonModel.find(), query);
               const result = await queryBuilder
                    .fields()
                    .paginate()
                    .sort()
                    .filter()
                    .search(['title'])
                    .modelQuery.exec();
               const meta = await queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.VERY_LONG,
     );
};

const getSeasonFromDB = async (id: string) => {
     return await seasonCache.wrapSingle(
          id,
          async () => {
               const result = await SeasonModel.findById(id);
               if (!result) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'Season not found');
               }
               return result;
          },
          CACHE_TTL.VERY_LONG,
     );
};

const updateSeasonFromDB = async (id: string, payload: Partial<ISeason>) => {
     const result = await SeasonModel.findByIdAndUpdate(id, payload, { new: true });
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Season not found');
     }
     await seasonCache.clearAfterUpdate(id);
     return result;
};

const deleteSeasonFromDB = async (id: string) => {
     const result = await SeasonModel.findByIdAndDelete(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Season not found');
     }
     await seasonCache.clearAfterUpdate(id);
     return result;
};

const getAllSeasonsForMovie = async (movieId: string) => {
     const result = await SeasonModel.find({ movieId }).sort({ seasonNumber: 1 });
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Seasons not found');
     }
     return result;
};

export const SeasonService = {
     createSeasonToDB,
     getAllSeasonsFromDB,
     getSeasonFromDB,
     updateSeasonFromDB,
     deleteSeasonFromDB,
     getAllSeasonsForMovie,
};

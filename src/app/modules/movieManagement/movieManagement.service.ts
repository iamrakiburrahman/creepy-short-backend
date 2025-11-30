import QueryBuilder from '../../builder/QueryBuilder';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import { IMovie } from './movieManagement.interface';
import { MovieModel } from './movieManagement.model';
const movieCache = createCacheHelper('movieCache');
const createMovieToDB = async (payload: IMovie) => {
     const result = await MovieModel.create(payload);
     await movieCache.clearLists();
     return result;
};

const getAllMoviesFromDB = async (query: Record<string, unknown>) => {
     return await movieCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(MovieModel.find(), query);

               const result = await queryBuilder.fields().paginate().sort().filter().search(['title']).modelQuery.exec();
               const meta = queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.VERY_LONG,
     );
};

const getMovieFromDB = async (id: string) => {
     const result = await MovieModel.findById(id);
     return result;
};

const updateMovieFromDB = async (id: string, payload: IMovie) => {
     const result = await MovieModel.findByIdAndUpdate(id, payload, { new: true });
     return result;
};

const deleteMovieFromDB = async (id: string) => {
     const result = await MovieModel.findByIdAndDelete(id);
     return result;
};

export const MovieService = {
     createMovieToDB,
     getAllMoviesFromDB,
     getMovieFromDB,
     updateMovieFromDB,
     deleteMovieFromDB,
};

import { StatusCodes } from 'http-status-codes';
import { ITrailer } from './trailer.interface';
import { Trailer } from './trailer.model';
import { JwtPayload } from 'jsonwebtoken';

import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';

const createTrailer = async (user: JwtPayload, payload: ITrailer): Promise<ITrailer> => {
     try {
          const result = await Trailer.create(payload);
          if (!result) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Trailer, please try again with valid data.');
          }

          return result;
     } catch (error: any) {
          if (error.code === 11000) {
               throw new AppError(StatusCodes.CONFLICT, 'Duplicate entry found');
          }
          throw error;
     }
};

const getAllTrailers = async (userId: string) => {};

const getSingleTrailer = async (id: string): Promise<ITrailer> => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Trailer ID');
     }

     const result = await Trailer.findById(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Requested trailer not found, please try again with valid id');
     }

     return result;
};

const updateTrailer = async (id: string, payload: Partial<ITrailer>): Promise<ITrailer | null> => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Trailer ID');
     }

     const result = await Trailer.findByIdAndUpdate(
          new Types.ObjectId(id),
          { $set: payload },
          {
               new: true,
               runValidators: true,
          },
     );

     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Requested trailer not found, please try again with valid id');
     }

     return result;
};

const deleteTrailer = async (id: string): Promise<ITrailer> => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Trailer ID');
     }

     const result = await Trailer.findByIdAndDelete(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Something went wrong while deleting trailer, please try again with valid id.');
     }

     return result;
};

export const TrailerServices = {
     createTrailer,
     getAllTrailers,
     getSingleTrailer,
     updateTrailer,
     deleteTrailer,
};

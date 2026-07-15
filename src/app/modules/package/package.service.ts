import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { IPackage } from './package.interface';
import { Package } from './package.model';
import { NotificationQueueHelper } from '../../../helpers/bullMQ/bullHelper';

const createPackageToDB = async (payload: IPackage): Promise<IPackage | null> => {
     payload.provider = payload.isGoogle ? 'google' : 'apple';

     const originalPrice = Number(payload.price.toFixed(2));

     payload.originalPrice = originalPrice;

     const hasDiscount = (payload.discount ?? 0) > 0;

     payload.price = hasDiscount
          ? Number(
                 (
                      originalPrice -
                      (originalPrice * payload.discount!) / 100
                 ).toFixed(2),
            )
          : originalPrice;

     const result = await Package.create(payload);

     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create package');
     }

     if (hasDiscount) {
          await NotificationQueueHelper.sendBroadcastNotification(
               `🎉 Special offer! Get ${payload.discount}% off on "${payload.name}". Limited time only. Grab it now!`,
               `🏷️ ${payload.discount}% Discount Available!`,
               'ADMIN',
          );
     }

     return result;
};
const updatePackageToDB = async (
     id: string,
     payload: Partial<IPackage>,
): Promise<IPackage | null> => {
     const packageData = await Package.findById(id);

     if (!packageData) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
     }

     payload.provider = payload.isGoogle ? 'google' : 'apple';

     const originalPrice = Number(
          (payload.price ?? packageData.originalPrice).toFixed(2),
     );

     payload.originalPrice = originalPrice;

     const discount = payload.discount ?? packageData.discount ?? 0;

     payload.price =
          discount > 0
               ? Number(
                      (
                           originalPrice -
                           (originalPrice * discount) / 100
                      ).toFixed(2),
                 )
               : originalPrice;

     const updatedPackage = await Package.findByIdAndUpdate(id, payload, {
          new: true,
          runValidators: true,
     });

     if (!updatedPackage) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update package');
     }

     return updatedPackage;
};

const getPackageFromDB = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Package.find({ isDeleted: false }), query);
     const packages = await queryBuilder.filter().sort().paginate().fields().modelQuery.exec();
     const meta = await queryBuilder.countTotal();

     return {
          packages,
          meta,
     };
};

const getPackageByUserFromDB = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(
          Package.find({ status: 'active', isDeleted: false }),
          query,
     );
     const packages = await queryBuilder.filter().sort().paginate().fields().modelQuery.exec();
     const meta = await queryBuilder.countTotal();
     return {
          packages,
          meta,
     };
};

const getPackageDetailsFromDB = async (id: string): Promise<IPackage | null> => {
     if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid ID');
     }
     const result = await Package.findById(id);

     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
     }

     return result;
};

const deletePackageToDB = async (id: string): Promise<IPackage | null> => {
     const isExistPackage = await Package.findById(id);

     if (!isExistPackage) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
     }

     const result = await Package.findByIdAndUpdate(
          id,
          {
               status: 'inactive',
               isDeleted: true,
               deletedAt: new Date(),
          },
          { new: true },
     );

     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete Package');
     }

     return result;
};

export const PackageService = {
     createPackageToDB,
     updatePackageToDB,
     getPackageFromDB,
     getPackageDetailsFromDB,
     deletePackageToDB,
     getPackageByUserFromDB,
};

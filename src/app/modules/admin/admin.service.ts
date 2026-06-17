import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enums/user';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
const adminCache = createCacheHelper('admin');

const createAdminToDB = async (payload: IUser): Promise<IUser> => {
     payload.role = USER_ROLES.ADMIN;
     const createAdmin: any = await User.create(payload);
     if (!createAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
     }
     if (createAdmin) {
          await User.findByIdAndUpdate(
               { _id: createAdmin?._id },
               { verified: true },
               { new: true },
          );
     }
     await adminCache.clearLists();
     return createAdmin;
};

const deleteAdminFromDB = async (id: any): Promise<IUser | undefined> => {
     const isExistAdmin = await User.findByIdAndDelete(id);
     if (!isExistAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
     }
     await adminCache.clearAfterUpdate(id);
     return;
};

const getAdminFromDB = async (): Promise<IUser[]> => {
     return await adminCache.wrapList(
          {},
          async () => {
               const admins = await User.find({ role: 'ADMIN' }).select(
                    'name email profile phone location pageAccess',
               );
               return admins;
          },
          CACHE_TTL.VERY_LONG,
     );
};
const updateAdminFromDB = async (id: string, payload: Partial<IUser>) => {
     const isExistAdmin = await User.findById(id);
     if (!isExistAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update Admin');
     }
     if (payload.password) {
          delete payload.password;
     }
     if (payload.email) {
          delete payload.email;
     }
     if (payload.role) {
          delete payload.role;
     }

     const updatedAdmin = await User.findByIdAndUpdate(id, payload, { new: true });
     await adminCache.clearAfterUpdate(id);
     return updatedAdmin;
};
export const AdminService = {
     createAdminToDB,
     deleteAdminFromDB,
     getAdminFromDB,
     updateAdminFromDB,
};

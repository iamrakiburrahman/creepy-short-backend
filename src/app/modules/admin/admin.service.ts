import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enums/user';
import bcrypt from 'bcrypt';
import config from '../../../config';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
const adminCache = createCacheHelper('admin');
const hashPassword = async (password: string) => {
     const salt = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
     return await bcrypt.hash(password, salt);
};
const createAdminToDB = async (payload: IUser): Promise<IUser> => {
     payload.role = USER_ROLES.ADMIN;
     payload.password = await hashPassword(payload.password as string);
     const createAdmin: any = await User.create(payload);
     if (!createAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
     }
     if (createAdmin) {
          await User.findByIdAndUpdate({ _id: createAdmin?._id }, { verified: true }, { new: true });
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
               const admins = await User.find({ role: 'ADMIN' }).select('name email profile contact location');
               return admins;
          },
          CACHE_TTL.VERY_LONG,
     );
};

export const AdminService = {
     createAdminToDB,
     deleteAdminFromDB,
     getAdminFromDB,
};

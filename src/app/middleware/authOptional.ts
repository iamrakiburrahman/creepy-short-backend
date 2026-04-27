import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../errors/AppError';
import { verifyToken } from '../../utils/verifyToken';
import { User } from '../modules/user/user.model';

const authOptional =
     (...roles: string[]) =>
     async (req: Request, res: Response, next: NextFunction) => {
          try {
               const tokenWithBearer = req.headers.authorization;

               // If no token, allow as guest
               if (!tokenWithBearer || !tokenWithBearer.startsWith('Bearer')) {
                    return next();
               }

               const token = tokenWithBearer.split(' ')[1];

               // Verify token
               let verifyUser: any;
               try {
                    verifyUser = verifyToken(token, config.jwt.jwt_secret as Secret);
               } catch (error) {
                    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token');
               }

               // Check if user exists
               const user = await User.isExistUserById(verifyUser.id);
               if (!user) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
               }

               if (user?.status === 'blocked') {
                    throw new AppError(StatusCodes.FORBIDDEN, 'User is blocked');
               }

               if (user?.isDeleted) {
                    throw new AppError(StatusCodes.FORBIDDEN, 'User account is deleted');
               }

               // Role check
               if (roles.length && !roles.includes(verifyUser?.role)) {
                    throw new AppError(StatusCodes.FORBIDDEN, "You don't have permission");
               }

               req.user = verifyUser;
               next();
          } catch (error) {
               next(error);
          }
     };

export default authOptional;

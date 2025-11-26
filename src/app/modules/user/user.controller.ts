import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import config from '../../../config';
import bcrypt from 'bcrypt';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';

const createUser = catchAsync(async (req, res) => {
     const { ...userData } = req.body;
     const result = await UserService.createUserToDB(userData);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User created successfully',
          data: result,
     });
});


const createAdmin = catchAsync(async (req, res) => {
     const { ...userData } = req.body;
     const result = await UserService.createAdminToDB(userData);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Admin created successfully',
          data: result,
     });
});

const getUserProfile = catchAsync(async (req, res) => {
     const user: any = req.user;
     const result = await UserService.getUserProfileFromDB(user);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile data retrieved successfully',
          data: result,
     });
});

//update profile
const updateProfile = catchAsync(async (req, res) => {
     const user: any = req.user;
     if ('role' in req.body) {
          delete req.body.role;
     }
     // If password is provided
     if (req.body.password) {
          req.body.password = await bcrypt.hash(req.body.password, Number(config.bcrypt_salt_rounds));
     }

     const result = await UserService.updateProfileToDB(user, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile updated successfully',
          data: result,
     });
});

//delete profile
const deleteProfile = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const { password } = req.body;
     const isUserVerified = await UserService.verifyUserPassword(id, password);
     if (!isUserVerified) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.UNAUTHORIZED,
               message: 'Incorrect password. Please try again.',
          });
     }

     const result = await UserService.deleteUser(id);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile deleted successfully',
          data: result,
     });
});

// ========== USER SEARCH AND MANAGEMENT CONTROLLERS ==========

// Find user by ID
const findUserById = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await UserService.findUserById(id);
     
     if (!result) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.NOT_FOUND,
               message: 'User not found',
          });
     }

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User found successfully',
          data: result,
     });
});

// Find user by email
const findUserByEmail = catchAsync(async (req, res) => {
     const { email } = req.params;
     const result = await UserService.findUserByEmail(email);
     
     if (!result) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.NOT_FOUND,
               message: 'User not found',
          });
     }

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User found successfully',
          data: result,
     });
});

// Find user by Google ID
const findUserByGoogleId = catchAsync(async (req, res) => {
     const { googleId } = req.params;
     const result = await UserService.findUserByGoogleId(googleId);
     
     if (!result) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.NOT_FOUND,
               message: 'User not found',
          });
     }

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User found successfully',
          data: result,
     });
});

// Find user by Facebook ID
const findUserByFacebookId = catchAsync(async (req, res) => {
     const { facebookId } = req.params;
     const result = await UserService.findUserByFacebookId(facebookId);
     
     if (!result) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.NOT_FOUND,
               message: 'User not found',
          });
     }

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User found successfully',
          data: result,
     });
});

// Get all users with pagination
const getAllUsers = catchAsync(async (req, res) => {
     const page = parseInt(req.query.page as string) || 1;
     const limit = parseInt(req.query.limit as string) || 10;
     
     const result = await UserService.findAllUsers(page, limit);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Users retrieved successfully',
          data: result,
     });
});

// Get users by role
const getUsersByRole = catchAsync(async (req, res) => {
     const { role } = req.params;
     const page = parseInt(req.query.page as string) || 1;
     const limit = parseInt(req.query.limit as string) || 10;
     
     if (!Object.values(USER_ROLES).includes(role as USER_ROLES)) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.BAD_REQUEST,
               message: 'Invalid role',
          });
     }
     
     const result = await UserService.findUsersByRole(role as USER_ROLES, page, limit);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Users retrieved successfully',
          data: result,
     });
});

// Get OAuth users
const getOAuthUsers = catchAsync(async (req, res) => {
     const { provider } = req.query;
     const result = await UserService.findOAuthUsers(provider as 'google' | 'facebook' | undefined);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'OAuth users retrieved successfully',
          data: result,
     });
});

// Get local users
const getLocalUsers = catchAsync(async (req, res) => {
     const result = await UserService.findLocalUsers();

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Local users retrieved successfully',
          data: result,
     });
});

// Search users
const searchUsers = catchAsync(async (req, res) => {
     const { q } = req.query;
     const page = parseInt(req.query.page as string) || 1;
     const limit = parseInt(req.query.limit as string) || 10;
     
     if (!q) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.BAD_REQUEST,
               message: 'Search term is required',
          });
     }
     
     const result = await UserService.searchUsers(q as string, page, limit);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Search completed successfully',
          data: result,
     });
});

// Get user statistics
const getUserStats = catchAsync(async (req, res) => {
     const result = await UserService.getUserStats();

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User statistics retrieved successfully',
          data: result,
     });
});

// Link OAuth account
const linkOAuthAccount = catchAsync(async (req, res) => {
     const { userId } = req.params;
     const { provider, providerId } = req.body;
     
     if (!provider || !providerId) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.BAD_REQUEST,
               message: 'Provider and providerId are required',
          });
     }
     
     const result = await UserService.linkOAuthAccount(userId, provider, providerId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'OAuth account linked successfully',
          data: result,
     });
});

// Unlink OAuth account
const unlinkOAuthAccount = catchAsync(async (req, res) => {
     const { userId } = req.params;
     const { provider } = req.body;
     
     if (!provider) {
          return sendResponse(res, {
               success: false,
               statusCode: StatusCodes.BAD_REQUEST,
               message: 'Provider is required',
          });
     }
     
     const result = await UserService.unlinkOAuthAccount(userId, provider);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'OAuth account unlinked successfully',
          data: result,
     });
});

export const UserController = {
     createUser,
     getUserProfile,
     updateProfile,
     createAdmin,
     deleteProfile,
     // New search and management methods
     findUserById,
     findUserByEmail,
     findUserByGoogleId,
     findUserByFacebookId,
     getAllUsers,
     getUsersByRole,
     getOAuthUsers,
     getLocalUsers,
     searchUsers,
     getUserStats,
     linkOAuthAccount,
     unlinkOAuthAccount,
};

import mongoose from 'mongoose';
import { DeviceToken } from './fcmToken.model';
import { logger } from '../../../shared/logger';
import colors from 'colors';
import { ITokenData } from './fcmToken.interface';

// const saveDeviceToken = async (userId: string | mongoose.Types.ObjectId, payload: ITokenData) => {
//      try {
//           const existingToken = await DeviceToken.findOne({
//                fcmToken: payload.fcmToken,
//           });

//           if (existingToken && existingToken.userId.toString() !== userId.toString()) {
//                await DeviceToken.deleteOne({ _id: existingToken._id });
//           }
//           const result = await DeviceToken.findOneAndUpdate(
//                {
//                     userId: userId,
//                     deviceId: payload.deviceId,
//                },
//                {
//                     userId: userId,
//                     deviceId: payload.deviceId,
//                     fcmToken: payload.fcmToken,
//                     deviceType: payload.deviceType,
//                },
//                {
//                     upsert: true,
//                     new: true,
//                     runValidators: true,
//                },
//           );

//           return result;
//      } catch (error) {
//           logger.error(colors.red('❌ Error saving device token:'), error);
//      }
// };
const saveDeviceToken = async (userId: string | mongoose.Types.ObjectId, payload: ITokenData) => {
     try {
          await DeviceToken.deleteMany({
               fcmToken: payload.fcmToken,
               userId: { $ne: userId },
          });

          // Step 2: Upsert - userId + deviceId combination
          const result = await DeviceToken.findOneAndUpdate(
               {
                    userId: userId,
                    deviceId: payload.deviceId,
               },
               {
                    $set: {
                         fcmToken: payload.fcmToken,
                         deviceType: payload.deviceType,
                         updatedAt: new Date(),
                    },
               },
               {
                    upsert: true,
                    new: true,
                    runValidators: true,
               },
          );

          logger.info(colors.green(`✅ Token saved: User ${userId}, Device ${payload.deviceId}`));
          return result;
     } catch (error) {
          logger.error(colors.red('❌ Error saving device token:'), error);
          throw error;
     }
};
export const FcmTokenService = {
     saveDeviceToken,
};

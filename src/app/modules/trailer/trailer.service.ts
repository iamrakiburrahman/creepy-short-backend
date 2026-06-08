import { StatusCodes } from 'http-status-codes';
import { ITrailer } from './trailer.interface';
import { Trailer } from './trailer.model';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import axios from 'axios';
import config from '../../../config';
import { createCacheHelper } from '../../builder/RedisCacheHelper';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enums/user';
import { BunnyStorageHandeler } from '../../../helpers/BunnyHelper';
import { NotificationQueueHelper } from '../../../helpers/bullMQ/bullHelper';
const trailerCacheKey = createCacheHelper('trailer');
const getAllTrailers = async (query: Record<string, unknown>) => {
     return await trailerCacheKey.wrapList(query, async () => {
          const queryBuilder = new QueryBuilder(Trailer.find(), query);
          const result = await queryBuilder.filter().sort().fields().paginate().modelQuery.exec();
          const meta = await queryBuilder.countTotal();
          return {
               meta,
               result,
          };
     });
};

const getSingleTrailer = async (id: string): Promise<ITrailer> => {
     return await trailerCacheKey.wrapSingle(id, async () => {
          if (!Types.ObjectId.isValid(id)) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Trailer ID');
          }
          const result = await Trailer.findById(id);
          if (result) {
               await Trailer.findByIdAndUpdate(id, { $inc: { views: 1 } });
          }
          if (!result) {
               throw new AppError(StatusCodes.NOT_FOUND, 'Requested trailer not found, please try again with valid id');
          }

          return result;
     });
};
const getSingleTrailerForUser = async (id: string, userId: string) => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Trailer ID');
     }
     const isUser = await User.findById(userId);
     if (!isUser) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
     const result = await Trailer.findById(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Requested trailer not found, please try again with valid id');
     }
     if (isUser.role === USER_ROLES.USER) {
          await Trailer.findByIdAndUpdate(id, { $inc: { views: 1 } });
          await trailerCacheKey.clearAfterUpdate(id);
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
     await trailerCacheKey.clearAfterUpdate(id);
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
     await trailerCacheKey.clearAfterUpdate(id);
     return result;
};
// const uploadThumbnail = async (videoId: string, thumbnailFile: Express.Multer.File) => {
//      if (!thumbnailFile) {
//           throw new AppError(StatusCodes.BAD_REQUEST, 'Thumbnail file is required');
//      }

//      console.log('🖼️ Uploading thumbnail for video:', videoId);

//      // 1. Upload to BunnyCDN
//      // BunnyCDN requires the file to be uploaded properly. Ensure correct Content-Type.
//      await axios.post(`https://video.bunnycdn.com/library/${config.bunnyCDN.stream_library_id}/videos/${videoId}/thumbnail`, thumbnailFile.buffer, {
//           headers: {
//                'AccessKey': config.bunnyCDN.stream_api_key,
//                'Content-Type': thumbnailFile.mimetype || 'image/jpeg',
//           },
//           maxBodyLength: Infinity,
//      });

//      // 2. Generate Correct Thumbnail URL
//      // NOTE: 'pull_zone_host' should be something like 'vz-12345.b-cdn.net' defined in your config
//      const thumbnailUrl = `https://${config.bunnyCDN.pull_zone_host}/${videoId}/thumbnail.jpg`;

//      // 3. Update database
//      const updatedTrailer = await Trailer.findOneAndUpdate(
//           { videoId },
//           {
//                $set: {
//                     videoId,
//                     libraryId: config.bunnyCDN.stream_library_id,
//                     thumbnailUrl: thumbnailUrl, // Save the correct URL to DB
//                },
//           },
//           { upsert: true, new: true },
//      );

//      if (!updatedTrailer) {
//           throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update trailer in database');
//      }

//      console.log('✅ Thumbnail uploaded successfully', thumbnailUrl);

//      // Cache clear logic
//      await trailerCacheKey.clearAfterUpdate(updatedTrailer?._id?.toString());

//      return thumbnailUrl;
// };

const uploadThumbnail = async (thumbnailFile: Express.Multer.File) => {
     if (!thumbnailFile) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Thumbnail file is required');
     }
     // 1. Upload to BunnyCDN
     const thumbnailUrl = await BunnyStorageHandeler.uploadToBunny(thumbnailFile, 'thumbnails');

     return thumbnailUrl;
};
const createTrailer = async (id: string, payload: ITrailer) => {
     const { videoId, title, color, contentName, description, thumbnailUrl, duration, downloadUrls } = payload;
     if (!videoId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Video ID is required');
     }

     const libraryId = config.bunnyCDN.stream_library_id as string;

     const video = await Trailer.create({
          videoId,
          libraryId,
          title: title || 'Untitled Video',
          color: color || 'primary',
          contentName: contentName || 'Trailer',
          description: description || '',
          videoUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
          thumbnailUrl: thumbnailUrl,
          status: 'active',
          duration: duration || 0,
          downloadUrls,
          uploadedBy: new Types.ObjectId(id),
          uploadedAt: new Date(),
     });

     await trailerCacheKey.clearLists();

     // 🔔 Broadcast notification to all users — new trailer uploaded
     await NotificationQueueHelper.sendBroadcastNotification(
          title ? `New trailer just dropped: "${title}". Watch it now!` : 'A new trailer has just been uploaded. Check it out!',
          '🎬 New Trailer Available',
          'ADMIN',
     );

     return video;
};

const generateUploadUrl = async (payload: { title?: string; fileName: string }) => {
     const { title, fileName } = payload;

     if (!fileName) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'File name is required');
     }

     console.log('🎬 Creating video object for:', title || fileName);

     const createResponse = await axios.post(
          `https://video.bunnycdn.com/library/${config.bunnyCDN.stream_library_id}/videos`,
          { title: title || fileName },
          {
               headers: {
                    'AccessKey': config.bunnyCDN.stream_api_key,
                    'Content-Type': 'application/json',
               },
          },
     );

     const videoId = createResponse.data.guid;
     const libraryId = config.bunnyCDN.stream_library_id as string;
     const pullZone = config.bunnyCDN.pull_zone_host as string;

     const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
     const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
     const downloadUrls = `https://${pullZone}/${videoId}/play_720p.mp4`;

     return {
          videoId,
          uploadUrl,
          apiKey: config.bunnyCDN.stream_api_key,
          embedUrl,
          libraryId,
          downloadUrls,
     };
};
export const TrailerServices = {
     createTrailer,
     getAllTrailers,
     getSingleTrailer,
     updateTrailer,
     deleteTrailer,
     generateUploadUrl,
     uploadThumbnail,
     getSingleTrailerForUser,
};

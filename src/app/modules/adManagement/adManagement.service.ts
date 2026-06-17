import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import axios from 'axios';
import config from '../../../config';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enums/user';
import { AdManagement } from './adManagement.model';
import { IAdManagement } from './adManagement.interface';
const addCacheKey = createCacheHelper('adManagement');

const getAllAdds = async (query: Record<string, unknown>) => {
     return await addCacheKey.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(AdManagement.find(), query);
               const result = await queryBuilder
                    .filter()
                    .sort()
                    .fields()
                    .paginate()
                    .modelQuery.exec();
               const meta = await queryBuilder.countTotal();
               return {
                    meta,
                    result,
               };
          },
          CACHE_TTL.MEDIUM,
     );
};
const getRandomAd = async () => {
     const [ad] = await AdManagement.aggregate([{ $sample: { size: 1 } }]);
     return ad || null;
};

const getSingleAdd = async (id: string): Promise<IAdManagement> => {
     return await addCacheKey.wrapSingle(id, async () => {
          if (!Types.ObjectId.isValid(id)) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Add ID');
          }
          const result = await AdManagement.findById(id);
          if (!result) {
               throw new AppError(
                    StatusCodes.NOT_FOUND,
                    'Requested add not found, please try again with valid id',
               );
          }
          return result;
     });
};
const getSingleAddForUser = async (id: string, userId: string) => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Add ID');
     }
     const isUser = await User.findById(userId);
     if (!isUser) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
     const result = await AdManagement.findById(id);
     if (!result) {
          throw new AppError(
               StatusCodes.NOT_FOUND,
               'Requested add not found, please try again with valid id',
          );
     }
     if (isUser.role === USER_ROLES.USER) {
          await AdManagement.findByIdAndUpdate(id, { $inc: { views: 1 } });
          await addCacheKey.clearAfterUpdate(id);
     }
     return result;
};

const updateAdd = async (id: string, payload: Partial<IAdManagement>) => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Add ID');
     }

     const result = await AdManagement.findByIdAndUpdate(
          new Types.ObjectId(id),
          { $set: payload },
          {
               new: true,
               runValidators: true,
          },
     );

     if (!result) {
          throw new AppError(
               StatusCodes.NOT_FOUND,
               'Requested add not found, please try again with valid id',
          );
     }
     await addCacheKey.clearAfterUpdate(id);
     return result;
};

const deleteAdd = async (id: string): Promise<IAdManagement> => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Add ID');
     }

     const result = await AdManagement.findByIdAndDelete(id);
     if (!result) {
          throw new AppError(
               StatusCodes.NOT_FOUND,
               'Something went wrong while deleting add, please try again with valid id.',
          );
     }
     await addCacheKey.clearAfterUpdate(id);
     return result;
};

const createAdd = async (id: string, payload: IAdManagement) => {
     const { videoId, name, downloadUrls, metadata } = payload;
     if (!videoId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Video ID is required');
     }

     const libraryId = config.bunnyCDN.stream_library_id as string;

     const video = await AdManagement.create({
          videoId,
          libraryId,
          name: name || 'Untitled Video',
          videoUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
          downloadUrls,
          metadata,
          uploadedBy: new Types.ObjectId(id),
          uploadedAt: new Date(),
     });

     await addCacheKey.clearLists();
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
export const AdManagementServices = {
     createAdd,
     getAllAdds,
     getSingleAdd,
     getSingleAddForUser,
     updateAdd,
     deleteAdd,
     generateUploadUrl,
     getRandomAd,
};

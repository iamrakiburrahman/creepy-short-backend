import { StatusCodes } from 'http-status-codes';
import { ITrailer } from './trailer.interface';
import { Trailer } from './trailer.model';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import axios from 'axios';
import config from '../../../config';
import { createCacheHelper } from '../../builder/RedisCacheHelper';
import QueryBuilder from '../../builder/QueryBuilder';
const trailerCacheKey = createCacheHelper('trailer');
const getAllTrailers = async (query: Record<string, unknown>) => {
     return await trailerCacheKey.wrapList(query, async () => {
          const queryBuilder = new QueryBuilder(Trailer.find(), query);
          const result = await queryBuilder.filter().sort().fields().paginate().modelQuery;
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
          if (!result) {
               throw new AppError(StatusCodes.NOT_FOUND, 'Requested trailer not found, please try again with valid id');
          }

          return result;
     });
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
const uploadThumbnail = async (videoId: string, thumbnailFile: Express.Multer.File) => {
     if (!thumbnailFile) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Thumbnail file is required');
     }

     console.log('🖼️ Uploading thumbnail for video:', videoId);

     // Upload to BunnyCDN
     await axios.post(`https://video.bunnycdn.com/library/${config.bunnyCDN.stream_library_id}/videos/${videoId}/thumbnail`, thumbnailFile.buffer, {
          headers: {
               'AccessKey': config.bunnyCDN.stream_api_key,
               'Content-Type': thumbnailFile.mimetype || 'image/jpeg',
          },
          maxBodyLength: Infinity,
     });

     // Update database
     const updatedTrailer = await Trailer.findOneAndUpdate(
          { videoId },
          {
               $set: {
                    videoId,
                    libraryId: config.bunnyCDN.stream_library_id,
               },
          },
          { upsert: true, new: true },
     );
     if (!updatedTrailer) {
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update trailer in database');
     }
     // Generate thumbnail URL
     const thumbnailUrl = `https://iframe.mediadelivery.net/api/thumbnail/${config.bunnyCDN.stream_library_id}/${videoId}?width=240&height=135&time=1`;

     console.log('✅ Thumbnail uploaded successfully', thumbnailUrl);
     await trailerCacheKey.clearAfterUpdate(updatedTrailer?._id?.toString());
     return thumbnailUrl;
};

const createTrailer = async (id: string, payload: ITrailer) => {
     const { videoId, title, color, contentName, description, thumbnailUrl, duration } = payload;
     console.log('payload', payload);
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
          status: 'processing',
          duration: duration || 0,
          uploadedBy: new Types.ObjectId(id),
          uploadedAt: new Date(),
     });

     console.log('✅ Video metadata saved successfully');
     await trailerCacheKey.clearLists();
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

     console.log('✅ Video object created with ID:', videoId);

     const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
     const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

     return {
          videoId,
          uploadUrl,
          apiKey: config.bunnyCDN.stream_api_key,
          embedUrl,
          libraryId,
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
};

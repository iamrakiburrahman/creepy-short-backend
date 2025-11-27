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
const uploadThumbnail = async (payload: { thumbnailUrl: string }) => {
     const { thumbnailUrl } = payload;

     if (!thumbnailUrl) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Thumbnail file is required');
     }
     // console.log('🖼️ Uploading thumbnail for video:', videoId);

     // await axios.post(
     //      `https://video.bunnycdn.com/library/${config.bunnyCDN.stream_library_id}/videos/${videoId}/thumbnail`,
     //      thumbnailFile.buffer,
     //      {
     //           headers: {
     //                AccessKey: config.bunnyCDN.stream_api_key,
     //                "Content-Type": thumbnailFile.mimetype || "image/jpeg",
     //           },
     //           maxBodyLength: Infinity,
     //      }
     // )
     // await VideoLibrary.findOneAndUpdate(
     //      { videoId },
     //      {
     //           $set: {
     //                videoId,
     //                libraryId: config.bunnyCDN.stream_library_id,
     //           },
     //      },
     //      { upsert: true }
     // )
     // const thumbnailUrl = `https://iframe.mediadelivery.net/api/thumbnail/${config.bunnyCDN.stream_library_id}/${videoId}?width=240&height=135&time=1`
     console.log('✅ Thumbnail uploaded successfully', thumbnailUrl);
     return thumbnailUrl;
};
const saveVideoMetadata = async (id: string, payload: IVideo) => {
     const { videoId, title, description, thumbnailUrl, duration, equipment } = payload;

     if (!videoId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Video ID is required');
     }

     console.log('💾 Saving video metadata for:', videoId);

     const libraryId = config.bunnyCDN.stream_library_id as string;;

     // Generate secure URLs
     // const secureUrls = getSecureVideoUrl(videoId, libraryId);

     const video = await VideoLibrary.create({
          videoId,
          libraryId,
          title: title || 'Untitled Video',
          description: description || '',
          videoUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
          thumbnailUrl: thumbnailUrl,
          status: 'processing',
          duration: duration || 0,
          equipment: equipment || [],
          uploadedBy: new Types.ObjectId(id),
          uploadedAt: new Date(),
     });

     console.log('✅ Video metadata saved successfully');
     return video;
};
export const TrailerServices = {
     createTrailer,
     getAllTrailers,
     getSingleTrailer,
     updateTrailer,
     deleteTrailer,
};

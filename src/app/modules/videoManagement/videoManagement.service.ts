import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import axios from 'axios';
import config from '../../../config';
import { IVideo } from './videoManagement.interface';
import { Video } from './videoManagement.model';

const getAllVideo = async (userId: string) => {};

const getSingleVideo = async (id: string): Promise<IVideo> => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Video ID');
     }

     const result = await Video.findById(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Requested video not found, please try again with valid id');
     }

     return result;
};

const updateVideo = async (id: string, payload: Partial<IVideo>): Promise<IVideo | null> => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Video ID');
     }

     const result = await Video.findByIdAndUpdate(
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

const deleteVideo = async (id: string): Promise<IVideo> => {
     if (!Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid Video ID');
     }

     const result = await Video.findByIdAndDelete(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Something went wrong while deleting trailer, please try again with valid id.');
     }

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
     await Video.findOneAndUpdate(
          { videoId },
          {
               $set: {
                    videoId,
                    libraryId: config.bunnyCDN.stream_library_id,
               },
          },
          { upsert: true },
     );

     // Generate thumbnail URL
     const thumbnailUrl = `https://iframe.mediadelivery.net/api/thumbnail/${config.bunnyCDN.stream_library_id}/${videoId}?width=240&height=135&time=1`;

     console.log('✅ Thumbnail uploaded successfully', thumbnailUrl);
     return thumbnailUrl;
};

const createVideo = async (id: string, payload: IVideo) => {
     const { videoId, title, description, thumbnailUrl, duration } = payload;

     if (!videoId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Video ID is required');
     }

     console.log('💾 Saving video metadata for:', videoId);

     const libraryId = config.bunnyCDN.stream_library_id as string;

     const video = await Video.create({
          videoId,
          libraryId,
          title: title || 'Untitled Video',
          description: description || '',
          videoUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
          thumbnailUrl: thumbnailUrl,
          status: 'processing',
          duration: duration || 0,
          uploadedBy: new Types.ObjectId(id),
          uploadedAt: new Date(),
     });

     console.log('✅ Video metadata saved successfully');
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
export const VideoManagementServices = {
     createVideo,
     getAllVideo,
     getSingleVideo,
     updateVideo,
     deleteVideo,
     generateUploadUrl,
     uploadThumbnail,
};

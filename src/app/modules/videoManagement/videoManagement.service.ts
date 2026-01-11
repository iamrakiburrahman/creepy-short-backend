import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import axios from 'axios';
import config from '../../../config';
import { IVideo } from './videoManagement.interface';
import { Video } from './videoManagement.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { BunnyStorageHandeler } from '../../../helpers/BunnyHelper';
import { User } from '../user/user.model';
import mongoose, { Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { AdManagement } from '../adManagement/adManagement.model';

const getAllVideos = async (query: Record<string, unknown>, seasonId: string) => {
     const queryBuilder = new QueryBuilder(Video.find({ seasonId: new mongoose.Types.ObjectId(seasonId) }), query).paginate().filter().sort().fields().search(['title', 'description']);
     const result = await queryBuilder.modelQuery.exec();
     const meta = await queryBuilder.countTotal();

     return {
          meta,
          result,
     };
};

const getSingleVideo = async (id: string, userId: string): Promise<IVideo> => {
     const result = await Video.findById(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Requested video not found, please try again with valid id');
     }
     await UserService.addRecentlyViewedVideosFromDB(userId, id);
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
const uploadThumbnail = async (thumbnailFile: Express.Multer.File) => {
     if (!thumbnailFile) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Thumbnail file is required');
     }
     const thumbnailUrl = await BunnyStorageHandeler.uploadToBunny(thumbnailFile, 'thumbnails');

     return thumbnailUrl;
};

const createVideo = async (id: string, payload: IVideo) => {
     const { videoId, title, description, thumbnailUrl, duration, movieId, seasonId, episodeNumber, downloadUrls } = payload;

     if (!videoId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Video ID is required');
     }

     if (!seasonId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Season ID is required');
     }

     const libraryId = config.bunnyCDN.stream_library_id as string;

     // ঐ season এর last video এর episodeNumber খুঁজে বের করা
     const lastVideo = await Video.findOne({ seasonId }).sort({ episodeNumber: -1 }).select('episodeNumber');

     const newEpisodeNumber = lastVideo && typeof lastVideo.episodeNumber === 'number' ? lastVideo.episodeNumber + 1 : 1;

     const video = await Video.create({
          title: title || `Episode ${newEpisodeNumber}`,
          description: description || '',
          duration: duration || 0,
          videoUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
          videoId: videoId,
          libraryId: libraryId,
          thumbnailUrl: thumbnailUrl,
          movieId: movieId,
          seasonId: seasonId,
          episodeNumber: episodeNumber || newEpisodeNumber,
          downloadUrls,
     });
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

     console.log('✅ Video object created with ID:', videoId);

     const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
     const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
     const downloadUrls = {
          original: `https://${pullZone}/${videoId}/original`,
          hd: `https://${pullZone}/${videoId}/play_1080p.mp4`,
          sd: `https://${pullZone}/${videoId}/play_720p.mp4`,
          mobile: `https://${pullZone}/${videoId}/play_480p.mp4`,
     };
     return {
          videoId,
          uploadUrl,
          apiKey: config.bunnyCDN.stream_api_key,
          embedUrl,
          downloadUrls,
          libraryId,
     };
};

// const getSeasonVideos = async (seasonId: string, userId: string) => {
//      const videos = await Video.find({ seasonId }).sort({ episodeNumber: 1 });
//      const user = await User.findById(userId).select('isSubscribed');

//      if (!user) {
//           throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
//      }

//      const result = videos.map((video, index) => {
//           // If user is subscribed, all videos are accessible
//           // If not subscribed, only first 3 videos are accessible
//           const isAccess = user.isSubscribed ? true : index < 3;

//           return {
//                ...video.toObject(),
//                isSubscribed: user.isSubscribed,
//                isAccess: isAccess,
//           };
//      });

//      return result;
// };
const getSeasonVideos = async (seasonId: string, userId: string) => {
     const [videos, user, ads] = await Promise.all([Video.find({ seasonId }).sort({ episodeNumber: 1 }), User.findById(userId).select('isSubscribed'), AdManagement.find({ isActive: true })]);

     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     const isSubscribed = user.isSubscribed;
     const result: any[] = [];
     let adIndex = 0;

     videos.forEach((video, index) => {
          result.push({
               type: 'video',
               ...video.toObject(),
               isSubscribed,
               isAccess: isSubscribed || index < 3,
          });

          if (!isSubscribed && (index + 1) % 3 === 0 && ads.length > 0) {
               result.push({
                    type: 'ad',
                    data: ads[adIndex % ads.length],
               });
               adIndex++;
          }
     });

     return result;
};
const getSortVideos = async (userId: string) => {
     const user = await User.findById(userId).select('isSubscribed');
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
     const isSubscribed = user.isSubscribed;
     const query: any = { isDeleted: false };

     if (!isSubscribed) {
          query.$or = [{ episodeNumber: 1 }, { seasonId: { $exists: false } }];
     }

     const videos = await Video.find(query).populate('seasonId', 'title seasonNumber').populate('movieId', 'title').sort({ seasonId: 1, episodeNumber: 1, createdAt: -1 });

     return videos.map((video) => ({
          ...video.toObject(),
          isSubscribed,
          isAccess: isSubscribed || video.episodeNumber === 1 || !video.seasonId,
     }));
};

export const VideoManagementServices = {
     createVideo,
     getAllVideos,
     getSingleVideo,
     updateVideo,
     deleteVideo,
     generateUploadUrl,
     uploadThumbnail,
     getSeasonVideos,
     getSortVideos,
};

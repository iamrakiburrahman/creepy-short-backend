import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { VideoManagementServices } from './videoManagement.service';

const updateVideo = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await VideoManagementServices.updateVideo(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Video updated successfully',
          data: result,
     });
});

const getSingleVideo = catchAsync(async (req, res) => {
     const { id } = req.params;
     const userId = (req.user as { id: string })?.id;
     const result = await VideoManagementServices.getSingleVideo(id, userId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Video retrieved successfully',
          data: result,
     });
});

const getAllVideos = catchAsync(async (req, res) => {
     const { seasonId } = req.params;
     const result = await VideoManagementServices.getAllVideos(req.query, seasonId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Videos retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

const deleteVideo = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await VideoManagementServices.deleteVideo(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Video deleted successfully',
          data: result,
     });
});

const generateUploadUrl = catchAsync(async (req, res) => {
     const result = await VideoManagementServices.generateUploadUrl(req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Upload URL generated successfully',
          data: result,
     });
});

const uploadThumbnail = catchAsync(async (req, res) => {
     const file = req.file;
     if (!file) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'No file uploaded');
     }
     const result = await VideoManagementServices.uploadThumbnail(file);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Thumbnail uploaded successfully',
          data: { result },
     });
});

const createVideo = catchAsync(async (req, res) => {
     const userId = (req.user as { id: string })?.id;

     const result = await VideoManagementServices.createVideo(userId, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Video created successfully',
          data: result,
     });
});

const getSeasonVideos = catchAsync(async (req, res) => {
     const { seasonId } = req.params;
     const userId = (req.user as { id: string })?.id;
     const result = await VideoManagementServices.getSeasonVideos(seasonId, userId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Videos retrieved successfully',
          data: result,
     });
});

const getSortVideos = catchAsync(async (req, res) => {
     const userId = (req.user as { id: string })?.id;
     const result = await VideoManagementServices.getSortVideos(userId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Videos retrieved successfully',
          data: result,
     });
});

const generateShareVideoUrl = catchAsync(async (req, res) => {
     const { videoId } = req.params;
     const result = await VideoManagementServices.generateShareVideoUrl(videoId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Video URL generated successfully',
          data: result,
     });
});

/* =====================================================
   FOR WEB BROWSERS: Redirects users without the app
===================================================== */
const getShareVideo = catchAsync(async (req, res) => {
     const { videoId } = req.params;
     const demoWebsiteUrl = `https://creepy-shorts.com?videoId=${videoId}`;

     let title = 'Watch on Creepy Shorts';
     let description = 'Download our app to watch the best creepy videos!';
     let imageUrl = 'https://res.cloudinary.com/dn83fu2pc/image/upload/Logo_uqqpzr.png';

     try {
          const video = await VideoManagementServices.getSingleVideo(videoId, '');

          if (video) {
               title = video.title || title;
               description = video.description || description;
               imageUrl = imageUrl;
          }
     } catch (error) {
          console.error('Error fetching video for share link preview:', error);
     }
     const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:type" content="video.other" />
            <meta property="og:url" content="https://api.creepy-shorts.com/shorts/${videoId}" />
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="${title}">
            <meta name="twitter:description" content="${description}">
            <meta name="twitter:image" content="${imageUrl}">

            <script>
                window.onload = function() {
                    window.location.href = "${demoWebsiteUrl}";
                };
            </script>
        </head>
        <body style="background-color: #121212; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h2>Redirecting to Creepy Shorts...</h2>
            <p>If you are not redirected automatically, <a href="${demoWebsiteUrl}" style="color: #4CAF50;">click here</a>.</p>
        </body>
        </html>
    `;
     res.status(200).send(htmlResponse);
});

/* =====================================================
   FOR MOBILE APP: Returns the JSON video data via deep link API
===================================================== */
const getSingleVideoApp = catchAsync(async (req, res) => {
     const { videoId } = req.params;
     const userId = (req.user as { id: string })?.id;

     const result = await VideoManagementServices.getSingleVideo(videoId, userId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Video retrieved successfully',
          data: result,
     });
});
const syncWatchTime = catchAsync(async (req, res) => {
     const { watchedSeconds, videoId } = req.body;
     const userId = (req.user as { id: string })?.id;
     const result = await VideoManagementServices.syncWatchTime(userId, watchedSeconds, videoId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Watch time synchronized successfully',
          data: result,
     });
});
export const VideoManagementController = {
     updateVideo,
     getSingleVideo,
     getAllVideos,
     deleteVideo,
     generateUploadUrl,
     uploadThumbnail,
     createVideo,
     getSeasonVideos,
     getSortVideos,
     generateShareVideoUrl,
     getShareVideo,
     getSingleVideoApp,
     syncWatchTime,
};

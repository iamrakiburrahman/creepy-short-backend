import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { LikeService } from './like.service';

const toggleLike = catchAsync(async (req, res) => {
     const { id }: any = req.user; // user id from the authenticated user
     const { videoId }: any = req.body; // Bookmark details from request body
     const payload = { userId: id, videoId };
     const result = await LikeService.toggleLike(payload);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: result.message,
          data: result.isLiked,
     });
});

// Additional function to delete a bookmark
const deleteLike = catchAsync(async (req, res) => {
     const { id }: any = req.user; // user id from the authenticated user
     const { referenceId }: any = req.params; // reference details from request params

     const result = await LikeService.deleteLike(id, referenceId);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: result.message, // Assuming result has a message property
     });
});

export const LikeController = {
     toggleLike,
     deleteLike,
};

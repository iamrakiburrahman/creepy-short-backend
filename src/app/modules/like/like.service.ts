import AppError from '../../../errors/AppError';
import { Like } from './like.model'; // Import the Bookmark model

// Toggle bookmark (add or remove)
const toggleLike = async (payload: { userId: string; videoId: string }) => {
     const { userId, videoId } = payload;
     const existingLike = await Like.findOne({ userId, videoId });

     if (existingLike) {
          await Like.deleteOne({ _id: existingLike._id });
          return { message: 'Like removed successfully', isLiked: false };
     } else {
          // If it doesn't exist, create a new bookmark
          const newLike = new Like({ userId, videoId, isLiked: true });
          await newLike.save();
          return { message: 'Like added successfully', isLiked: true };
     }
};

// Delete a specific bookmark
const deleteLike = async (userId: string, referenceId: string) => {
     const result = await Like.deleteOne({ userId, referenceId });

     if (result.deletedCount === 0) {
          throw new AppError(404, 'Like not found');
     }

     return { message: 'Like deleted successfully', isLiked: false };
};

export const LikeService = { toggleLike, deleteLike };

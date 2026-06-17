import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Comment } from './comments.model';

// create comment
const createCommentToDB = async (userId: string, postId: string, content: string) => {
     if (!content.trim()) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Content cannot be empty');
     }

     const newComment = new Comment({
          userId,
          postId,
          content,
          likes: 0,
          replies: [],
     });
     return newComment.save();
};
// get comments
const getComments = async (postId: string, query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Comment.find({ postId }).populate('replies'), query);
     const comments = await queryBuilder.paginate().modelQuery.exec();

     const meta = await queryBuilder.countTotal();

     return { comments, meta };
};
// like comments
const likeComment = async (commentId: string) => {
     const comment = await Comment.findByIdAndUpdate(
          commentId,
          { $inc: { likes: 1 } },
          { new: true },
     );

     if (!comment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Comment not found');
     }

     return { likes: comment.likes };
};
// reply comments
const replyToComment = async (commentId: string, userId: string, content: string) => {
     if (!content.trim()) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Reply content cannot be empty');
     }

     const parentComment = await Comment.findById(commentId);
     if (!parentComment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Parent comment not found');
     }

     // Create reply without saving it yet
     const reply = new Comment({
          userId,
          postId: parentComment.postId,
          content,
          likes: 0,
          replies: [],
     });

     const replyId = reply._id;
     const result = await Comment.updateOne({ _id: commentId }, { $push: { replies: replyId } });

     if (!result) {
          throw new AppError(
               StatusCodes.INTERNAL_SERVER_ERROR,
               'Failed to update parent comment with the new reply',
          );
     }

     await reply.save();
     return reply;
};

export const CommentsService = {
     createCommentToDB,
     likeComment,
     replyToComment,
     getComments,
};

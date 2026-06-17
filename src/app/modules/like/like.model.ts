import { Schema, model } from 'mongoose';
import { ILike } from './like.interface';

const likeSchema = new Schema<ILike>(
     {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          videoId: {
               type: Schema.Types.ObjectId,
               refPath: 'Video',
               required: true,
          },
          isLiked: {
               type: Boolean,
               default: true,
          },
     },
     { timestamps: true },
);

export const Like = model<ILike>('Like', likeSchema);

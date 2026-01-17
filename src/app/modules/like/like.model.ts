import { Schema, model } from 'mongoose';
import { IBookmark } from './like.interface';

const bookmarkSchema = new Schema<IBookmark>(
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

export const Like = model<IBookmark>('Like', bookmarkSchema);

// {
//   "referenceId": "60d5f1d0d4b7b13992b0f92a",
//   "referenceType": "video"
// }

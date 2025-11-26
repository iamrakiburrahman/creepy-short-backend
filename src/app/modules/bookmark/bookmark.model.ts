import { Schema, model } from 'mongoose';
import { IBookmark } from './bookmark.interface';

const bookmarkSchema = new Schema<IBookmark>(
     {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          referenceId: {
               type: Schema.Types.ObjectId,
               required: true,
          },
          referenceType: {
               type: String,
               enum: ['video', 'article', 'image', 'post'], // extend as needed
               required: true,
          },
          isBookmarked: {
               type: Boolean,
               default: true,
          },
     },
     { timestamps: true },
);

export const Bookmark = model<IBookmark>('Bookmark', bookmarkSchema);


// {
//   "referenceId": "60d5f1d0d4b7b13992b0f92a",
//   "referenceType": "video"
// }
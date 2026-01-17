import { Types } from 'mongoose';

export interface IBookmark extends Document {
     userId: Types.ObjectId;
     videoId: Types.ObjectId;
     isLiked: boolean;
     createdAt: Date;
     updatedAt: Date;
}

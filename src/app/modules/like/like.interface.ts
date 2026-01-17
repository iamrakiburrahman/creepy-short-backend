import { Types } from 'mongoose';

export interface ILike extends Document {
     userId: Types.ObjectId;
     videoId: Types.ObjectId;
     isLiked: boolean;
     createdAt: Date;
     updatedAt: Date;
}

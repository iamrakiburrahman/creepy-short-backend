import { Model, Types } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IReaction {
     userId: Types.ObjectId;
     reactionType: 'like' | 'love' | 'thumbs_up' | 'laugh' | 'angry' | 'sad';
     timestamp: Date;
}

export type IMessage = {
     chatId: Types.ObjectId;
     sender: Types.ObjectId;
     text?: string;
     images?: string[];
     reactions: IReaction[];
     read: boolean;
     isDeleted: boolean;
     type: 'text' | 'image' | 'doc' | 'both';
     // New field for pinned messages
     isPinned: boolean;
     pinnedBy?: Types.ObjectId;
     pinnedAt?: Date;
     pinnedByUsers: {
          userId: Types.ObjectId;
          pinnedAt: Date;
     }[];
     deletedForUsers: {
          userId: Types.ObjectId;
          deletedAt: Date;
     }[];
     iconViewed: Types.ObjectId[];
     // Reply functionality fields
     replyTo?: Types.ObjectId | IMessage;
     replyText?: string; // Original message text being replied to
     replySender?: Types.ObjectId | IUser; // Original message sender
     replyType?: 'text' | 'image' | 'doc' | 'both'; // Original message type
};

export type MessageModel = Model<IMessage, Record<string, unknown>>;

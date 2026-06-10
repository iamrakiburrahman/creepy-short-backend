import { Model, Types } from 'mongoose';

export type ItemType = 'Movie' | 'Video' | 'Trailer';

export type IViewHistory = {
     date: Date; // Stores the start of the hour (UTC)
     itemType: ItemType;
     itemId: Types.ObjectId;
     count: number;
     createdAt?: Date;
     updatedAt?: Date;
};

export type ViewHistoryModel = Model<IViewHistory>;

import { Model, Types } from 'mongoose';

export interface ITrailer {
     _id: Types.ObjectId;
     uploadedBy: Types.ObjectId;
     title: string;
     duration: string;
     color: string;
     contentName: string;
     description: string;
     videoUrl: string;
     videoId: string;
     libraryId: string;
     thumbnailUrl: string;
     status: string;
     views: number;
}

export type TrailerModel = Model<ITrailer, {}, {}>;

import { Model, Types } from 'mongoose';

export interface IAdManagement {
     _id: Types.ObjectId;
     uploadedBy: Types.ObjectId;
     name: string;
     videoUrl: string;
     videoId: string;
     libraryId: string;
     redirectUrl: string;
     views: number;
     downloadUrls: string;
}

export type AdManagementModel = Model<IAdManagement, {}, {}>;

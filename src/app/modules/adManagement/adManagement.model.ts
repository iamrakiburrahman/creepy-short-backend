import { Schema, model } from 'mongoose';
import { IAdManagement, AdManagementModel } from './adManagement.interface';

const adManagementSchema = new Schema<IAdManagement, AdManagementModel>(
     {
          name: { type: String, required: true },
          videoUrl: { type: String, required: true },
          videoId: { type: String, required: true },
          libraryId: { type: String, required: true },
          views: { type: Number, default: 0, min: 0 },
          metadata: {
               title: { type: String, default: '', trim: true },
               description: { type: String, default: '', trim: true },
               link: { type: String, default: '', trim: true },
          },
          downloadUrls: { type: String, required: true },
          uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
     },
     {
          timestamps: true,
          toJSON: { virtuals: true },
          toObject: { virtuals: true },
     },
);

export const AdManagement = model<IAdManagement, AdManagementModel>(
     'AdManagement',
     adManagementSchema,
);

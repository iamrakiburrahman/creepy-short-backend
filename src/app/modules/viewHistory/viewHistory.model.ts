import { Schema, model } from 'mongoose';
import { IViewHistory, ViewHistoryModel } from './viewHistory.interface';

const viewHistorySchema = new Schema<IViewHistory, ViewHistoryModel>(
     {
          date: { type: Date, required: true },
          itemType: { type: String, enum: ['Movie', 'Video', 'Trailer'], required: true },
          itemId: { type: Schema.Types.ObjectId, required: true },
          count: { type: Number, default: 0 },
     },
     {
          timestamps: true,
     },
);

// Add unique compound index for date, itemType, itemId
viewHistorySchema.index({ date: 1, itemType: 1, itemId: 1 }, { unique: true });

export const ViewHistory = model<IViewHistory, ViewHistoryModel>('ViewHistory', viewHistorySchema);

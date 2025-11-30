import { Schema, model } from 'mongoose';
import { ISeason } from './sessionManagement.interface';

// --- Season Schema ---
const seasonSchema = new Schema<ISeason>(
     {
          title: { type: String, required: true },
          seasonNumber: { type: Number, required: true },
          seriesId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
          description: { type: String },
     },
     { timestamps: true },
);

export const SeasonModel = model<ISeason>('Season', seasonSchema);

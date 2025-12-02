import { Schema, model } from 'mongoose';
import { IMovie } from './movieManagement.interface';

// --- Movie Schema ---
const movieSchema = new Schema<IMovie>(
     {
          title: { type: String, required: true },
          type: { type: String, enum: ['Movie', 'Series'], required: true },
          genre: { type: String, required: true },
          tags: [{ type: String }],
          description: { type: String },
          bannerUrl: { type: String },
          accentColor: { type: String, default: '#3B82F6' },
          thumbnailUrl: { type: String },
          status: { type: String, enum: ['Ongoing', 'Completed'], default: 'Ongoing' },
          totalViews: { type: Number, default: 0 },
          rating: { type: Number, default: 0 },
          releaseDate: { type: Date },
          isReleased: { type: Boolean, default: false },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const MovieModel = model<IMovie>('Movie', movieSchema);

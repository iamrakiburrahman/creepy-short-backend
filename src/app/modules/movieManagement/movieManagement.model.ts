import { Schema, model } from 'mongoose';
import { IMovie } from './movieManagement.interface';

// --- Movie Schema ---
const movieSchema = new Schema<IMovie>(
     {
          title: { type: String, required: true },
          category: { type: String, required: true },
          categoryId: { type: Schema.Types.ObjectId, required: true },
          genre: { type: String, required: true },
          tags: [{ type: String }],
          description: { type: String },
          accentColor: { type: String, default: '#3B82F6' },
          thumbnail: { type: String },
          status: { type: String, enum: ['Ongoing', 'Completed'], default: 'Ongoing' },
          totalViews: { type: Number, default: 0 },
          rating: { type: Number, default: 0 },
          releaseDate: { type: Date, default: Date.now },
          isReleased: { type: Boolean, default: true },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const MovieModel = model<IMovie>('Movie', movieSchema);

import { Schema, model } from 'mongoose';
import { IMovie, IVideo } from './management.interface';

// --- Movie Schema ---
const movieSchema = new Schema<IMovie>(
     {
          title: { type: String, required: true },
          genre: { type: String, required: true },
          type: { type: String, enum: ['Movie', 'Series'], required: true },
          tags: [{ type: String }],
          description: { type: String },
          bannerUrl: { type: String },
          accentColor: { type: String, default: '#3B82F6' },
          thumbnailUrl: { type: String },
          status: { type: String, enum: ['Ongoing', 'Completed'], default: 'Ongoing' },
          totalViews: { type: Number, default: 0 },
          rating: { type: Number, default: 0 },
          releaseDate: { type: Date, default: Date.now },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

const videoSchema = new Schema<IVideo>(
     {
          title: { type: String, required: true },
          description: { type: String },
          duration: { type: Number, required: true },
          videoUrl: { type: String, required: true },
          thumbnailUrl: { type: String, required: true },
          // Links to the main Movie or Series
          movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
          // Optional fields (Only used if parent is a Series)
          seasonId: { type: Schema.Types.ObjectId, ref: 'Season' },
          episodeNumber: { type: Number },

          views: { type: Number, default: 0 },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const Video = model<IVideo>('Video', videoSchema);
export const Movie = model<IMovie>('Movie', movieSchema);

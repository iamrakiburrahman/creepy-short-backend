import { Schema, model } from 'mongoose';
import { IVideo } from './videoManagement.interface';


const videoSchema = new Schema<IVideo>(
     {
          title: { type: String, required: true },
          description: { type: String },
          duration: { type: Number, required: true },
          videoUrl: { type: String, required: true },
          videoId: { type: String, required: true },
          libraryId: { type: String, required: true },
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


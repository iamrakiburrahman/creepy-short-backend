import { Schema, model } from 'mongoose';
import { ITrailer, TrailerModel } from './trailer.interface';

const trailerSchema = new Schema<ITrailer, TrailerModel>(
     {
          title: { type: String, required: true },
          duration: { type: String, required: true },
          color: { type: String, required: true },
          contentName: { type: String, required: true },
          description: { type: String, required: true },
          videoUrl: { type: String, required: true },
          videoId: { type: String, required: true },
          libraryId: { type: String, required: true },
          thumbnailUrl: { type: String, required: true },
          status: { type: String, required: true },
          views: { type: Number, default: 0 },
          downloadUrls: {
               type: {
                    original: String,
                    hd: String,
                    sd: String,
                    mobile: String,
               },
               required: false,
          },
          uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
     },
     {
          timestamps: true,
          toJSON: { virtuals: true },
          toObject: { virtuals: true },
     },
);
trailerSchema.virtual('thumbnailUrlWithCache').get(function () {
     if (this.thumbnailUrl && this.updatedAt) {
          const timestamp = new Date(this.updatedAt).getTime();
          return `${this.thumbnailUrl}?v=${timestamp}`;
     }
     return this.thumbnailUrl;
});
export const Trailer = model<ITrailer, TrailerModel>('Trailer', trailerSchema);

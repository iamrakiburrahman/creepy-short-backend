import { Schema, model } from 'mongoose';
import { IDynamicContent } from './dynamicContent.interface';

const dynamicContentSchema = new Schema<IDynamicContent>(
     {
          key: {
               type: String,
               required: true,
               unique: true,
               trim: true,
          },
          type: {
               type: String,
               required: true,
               enum: ['image'],
          },
          images: {
               type: [String],
               default: [],
               required: true,
          },
     },
     {
          timestamps: true,
     },
);

export const DynamicContent = model<IDynamicContent>('DynamicContent', dynamicContentSchema);

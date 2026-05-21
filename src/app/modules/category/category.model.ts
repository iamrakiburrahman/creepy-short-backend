import { model, Schema } from 'mongoose';
import { CategoryModel, ICategory } from './category.interface';

const serviceSchema = new Schema<ICategory, CategoryModel>(
     {
          name: {
               type: String,
               required: true,
               unique: true,
          },
          status: {
               type: String,
               default: 'active',
          },
     },
     { timestamps: true },
);

export const Category = model<ICategory, CategoryModel>('Category', serviceSchema);

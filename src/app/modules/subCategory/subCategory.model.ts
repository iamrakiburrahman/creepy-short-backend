import { model, Schema } from 'mongoose';
import { ISubCategory, SubCategoryModel } from './subCategory.interface';

const serviceSchema = new Schema<ISubCategory, SubCategoryModel>(
     {
          categoryId: {
               type: Schema.Types.ObjectId,
               required: true,
               ref: 'Category',
          },
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

export const SubCategory = model<ISubCategory, SubCategoryModel>('SubCategory', serviceSchema);

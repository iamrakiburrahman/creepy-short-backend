import { Model, Types } from 'mongoose';

export type ISubCategory = {
     categoryId: Types.ObjectId;
     name: string;
     status: string;
};

export type SubCategoryModel = Model<ISubCategory, Record<string, unknown>>;

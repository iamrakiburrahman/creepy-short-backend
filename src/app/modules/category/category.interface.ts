import { Model } from 'mongoose';

export type ICategory = {
     name: string;
     status: string;
};

export type CategoryModel = Model<ICategory, Record<string, unknown>>;

// services/dynamicContent.service.ts
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IDynamicContent } from './dynamicContent.interface';
import { DynamicContent } from './dynamicContent.model';

const createOrUpdateContent = async (payload: IDynamicContent): Promise<IDynamicContent> => {
     const result = await DynamicContent.findOneAndUpdate({ key: payload.key }, payload, { new: true, upsert: true, runValidators: true });

     return result;
};

const getContentByKey = async (key: string) => {
     const result = await DynamicContent.findOne({ key });
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, `Content with key '${key}' not found`);
     }
     return result;
};

const getContentByCategory = async (category: string) => {
     const result = await DynamicContent.find({ category });
     return result;
};

const getAllContent = async () => {
     return await DynamicContent.find();
};

const deleteContent = async (key: string) => {
     const result = await DynamicContent.findOneAndDelete({ key });
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, `Content with key '${key}' not found`);
     }
     return result;
};

export const DynamicContentService = {
     createOrUpdateContent,
     getContentByKey,
     getContentByCategory,
     getAllContent,
     deleteContent,
};

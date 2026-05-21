import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import { Category } from '../category/category.model';
import { ISubCategory } from './subCategory.interface';
import { SubCategory } from './subCategory.model';

const subCategoryCache = createCacheHelper('subCategory');

const createSubCategoryToDB = async (payload: ISubCategory) => {
     const { name, categoryId } = payload;

     const isExistName = await SubCategory.findOne({ name: name });
     if (isExistName) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Sub Category Name Already Exist');
     }

     const parentCategory = await Category.findById(categoryId);
     if (!parentCategory) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Parent Category not found');
     }

     const createSubCategory: any = await SubCategory.create(payload);
     if (!createSubCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Sub Category');
     }

     await subCategoryCache.clearLists();
     return createSubCategory;
};

const getSubCategoriesFromDB = async (categoryId?: string): Promise<ISubCategory[]> => {
     const query = categoryId ? { categoryId, status: 'active' } : { status: 'active' };
     const result = await subCategoryCache.wrapList({}, async () => await SubCategory.find(query), CACHE_TTL.VERY_LONG);
     return result;
};

const getAllSubCategoriesFromDB = async (): Promise<ISubCategory[]> => {
     const result = await SubCategory.find({});
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'No subcategories found');
     }
     return result;
};

const updateSubCategoryToDB = async (id: string, payload: ISubCategory) => {
     const isExistSubCategory: any = await SubCategory.findById(id);

     if (!isExistSubCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Subcategory doesn't exist");
     }

     if (payload.categoryId && payload.categoryId !== isExistSubCategory.categoryId) {
          const parentCategory = await Category.findById(payload.categoryId);
          if (!parentCategory) {
               throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Parent Category not found');
          }
     }

     const updateSubCategory = await SubCategory.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });

     await subCategoryCache.clearAfterUpdate(id);
     return updateSubCategory;
};

const deleteSubCategoryToDB = async (id: string): Promise<ISubCategory | null> => {
     const deleteSubCategory = await SubCategory.findByIdAndDelete(id);
     if (!deleteSubCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Subcategory doesn't exist");
     }

     await subCategoryCache.clearAfterUpdate(id);
     return deleteSubCategory;
};

export const SubCategoryService = {
     createSubCategoryToDB,
     getSubCategoriesFromDB,
     updateSubCategoryToDB,
     deleteSubCategoryToDB,
     getAllSubCategoriesFromDB,
};

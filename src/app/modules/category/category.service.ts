import { StatusCodes } from 'http-status-codes';
import { ICategory } from './category.interface';
import { Category } from './category.model';
import AppError from '../../../errors/AppError';

const createCategoryToDB = async (payload: ICategory) => {
     const { name } = payload;
     const isExistName = await Category.findOne({ name: name });
     if (isExistName) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Category Name Already Exist');
     }
     const createCategory: any = await Category.create(payload);
     if (!createCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Category');
     }
     return createCategory;
};

const getCategoriesFromDB = async (): Promise<ICategory[]> => {
     const result = await Category.find({ status: 'active' });
     return result;
};
const getAllCategoriesFromDB = async (): Promise<ICategory[]> => {
     const result = await Category.find({});
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'No categories found');
     }
     return result;
};

const updateCategoryToDB = async (id: string, payload: ICategory) => {
     const isExistCategory: any = await Category.findById(id);

     if (!isExistCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }
     const updateCategory = await Category.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });
     return updateCategory;
};

const deleteCategoryToDB = async (id: string): Promise<ICategory | null> => {
     const deleteCategory = await Category.findByIdAndDelete(id);
     if (!deleteCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }
     return deleteCategory;
};

export const CategoryService = {
     createCategoryToDB,
     getCategoriesFromDB,
     updateCategoryToDB,
     deleteCategoryToDB,
     getAllCategoriesFromDB,
};

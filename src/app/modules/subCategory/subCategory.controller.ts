import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SubCategoryService } from './subCategory.service';

const createSubCategory = catchAsync(async (req, res) => {
     const result = await SubCategoryService.createSubCategoryToDB(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Subcategory created successfully',
          data: result,
     });
});

const getSubCategories = catchAsync(async (req, res) => {
     const categoryId = req.query.categoryId as string | undefined;
     const result = await SubCategoryService.getSubCategoriesFromDB(categoryId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Subcategories retrieved successfully',
          data: result,
     });
});

const deleteSubCategory = catchAsync(async (req, res) => {
     const id = req.params.id;
     const result = await SubCategoryService.deleteSubCategoryToDB(id);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Subcategory deleted successfully',
          data: result,
     });
});

export const SubCategoryController = {
     createSubCategory,
     getSubCategories,
     deleteSubCategory,
};

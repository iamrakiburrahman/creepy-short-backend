// controllers/dynamicContent.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { DynamicContentService } from './dynamicContent.service';

const createOrUpdate = catchAsync(async (req: Request, res: Response) => {
     const result = await DynamicContentService.createOrUpdateContent(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Content saved successfully',
          data: result,
     });
});

const getByKey = catchAsync(async (req: Request, res: Response) => {
     const { key } = req.params;
     const result = await DynamicContentService.getContentByKey(key);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Content fetched successfully',
          data: result,
     });
});

const getByCategory = catchAsync(async (req: Request, res: Response) => {
     const { category } = req.params;
     const result = await DynamicContentService.getContentByCategory(category);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Contents fetched successfully',
          data: result,
     });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
     const result = await DynamicContentService.getAllContent();

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'All contents fetched successfully',
          data: result,
     });
});

const deleteContent = catchAsync(async (req: Request, res: Response) => {
     const { key } = req.params;
     const result = await DynamicContentService.deleteContent(key);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Content deleted successfully',
          data: result,
     });
});

export const DynamicContentController = {
     createOrUpdate,
     getByKey,
     getByCategory,
     getAll,
     deleteContent,
};

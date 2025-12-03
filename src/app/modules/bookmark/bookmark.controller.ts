import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BookmarkService } from './bookmark.service';

const toggleBookmark = catchAsync(async (req, res) => {
     const { id }: any = req.user; // user id from the authenticated user
     const { referenceId, referenceType }: any = req.body; // Bookmark details from request body
     const payload = { userId: id, referenceId, referenceType };
     const result = await BookmarkService.toggleBookmark(payload);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: 'Bookmark Toggled Successfully',
          data: result,
     });
});

const getBookmark = catchAsync(async (req, res) => {
     const user: any = req.user; // authenticated user
     const { referenceType }: any = req.query; // Optionally filter by referenceType (e.g., 'video', 'article')
     const result = await BookmarkService.getBookmark(user.id, referenceType);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: 'Bookmark Retrieved Successfully',
          data: result,
     });
});

// Additional function to delete a bookmark
const deleteBookmark = catchAsync(async (req, res) => {
     const { id }: any = req.user; // user id from the authenticated user
     const { referenceId }: any = req.params; // reference details from request params

     const result = await BookmarkService.deleteBookmark(id, referenceId);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: result.message, // Assuming result has a message property
     });
});

// Method to fetch all bookmarks for a user
const getUserBookmarks = catchAsync(async (req: Request, res: Response) => {
     const user: any = req.user; // authenticated user
     const result = await BookmarkService.getUserBookmarks(user.id);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: 'User Bookmarks Retrieved Successfully',
          data: result,
     });
});

export const BookmarkController = {
     toggleBookmark,
     getBookmark,
     deleteBookmark,
     getUserBookmarks,
};

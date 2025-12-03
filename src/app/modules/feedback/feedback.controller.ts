import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { FeedbackService } from './feedback.service';

const createFeedback = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const feedback = await FeedbackService.createFeedback(id, req.body);
     sendResponse(res, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'Feedback created successfully',
          data: feedback,
     });
});

const getFeedbacks = catchAsync(async (req, res) => {
     const result = await FeedbackService.getFeedbacks(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Feedbacks retrieved successfully',
          meta: result.meta,
          data: result.result,
     });
});

const deleteFeedback = catchAsync(async (req, res) => {
     const result = await FeedbackService.deleteFeedback(req.params.feedbackId);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Feedback deleted successfully',
          data: result,
     });
});
const deleteAllFeedbacks = catchAsync(async (req, res) => {
     const result = await FeedbackService.deleteAllFeedbacks();
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'All feedbacks deleted successfully',
          data: result,
     });
});

export const FeedbackController = {
     createFeedback,
     getFeedbacks,
     deleteFeedback,
     deleteAllFeedbacks,
};

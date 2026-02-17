import catchAsync from '../../../shared/catchAsync';
import { SubscriptionService } from './subscription.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const subscriptions = catchAsync(async (req, res) => {
     const result = await SubscriptionService.subscriptionsFromDB(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Subscription list retrieved successfully',
          data: result,
     });
});

const subscriptionDetails = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.subscriptionDetailsFromDB(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Subscription details retrieved successfully',
          data: result.subscription,
     });
});

const createCheckoutSessionForApp = catchAsync(async (req, res) => {
     const { id }: any = req.user;

     const result = await SubscriptionService.createIAPSubscription(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Create IAP subscription successfully',
          data: result,
     });
});

const checkAccess = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.checkSubscriptionAccess(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Access status retrieved successfully',
          data: result,
     });
});

const getTransactionHistory = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.getTransactionHistory(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Transaction history retrieved successfully',
          data: result,
     });
});

export const SubscriptionController = {
     subscriptions,
     subscriptionDetails,
     checkAccess,
     getTransactionHistory,
     createCheckoutSessionForApp,
};

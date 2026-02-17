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

const cancelSubscription = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.cancelSubscriptionToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Cancel subscription successfully',
          data: result,
     });
});
// create checkout session


const createCheckoutSessionForApp = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     
     const result = await SubscriptionService.createIAPSubscription(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Create IAP subscription successfully',
          data: result,
     });
})

const orderSuccess = catchAsync(async (req, res) => {
     const sessionId = req.query.session_id as string;
     const session = await SubscriptionService.successMessage(sessionId);
     res.render('success', { session });
});
// Assuming you have OrderServices imported properly
const orderCancel = catchAsync(async (req, res) => {
     res.render('cancel');
});



const checkAccess = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     // const result = await SubscriptionService.checkSubscriptionAccess(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Access status retrieved successfully',
          // data: result,
     });
});




// Handle subscription expiry
const handleExpiry = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.handleSubscriptionExpiry(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Subscription expiry handled successfully',
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

// Unified subscription handler - handles new subscription, renewal, and package change


export const SubscriptionController = {
     subscriptions,
     subscriptionDetails,
     cancelSubscription,
     orderSuccess,
     orderCancel,
     checkAccess,
     handleExpiry,
     getTransactionHistory,
     createCheckoutSessionForApp,
};

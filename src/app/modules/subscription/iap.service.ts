import { google } from 'googleapis';
import appleReceiptVerify from 'node-apple-receipt-verify';
import config from '../../../config';
import { errorLogger } from '../../../shared/logger';

// --- Apple Setup ---
appleReceiptVerify.config({
     secret: config.iap.apple_shared_secret as string,
     environment: ['sandbox'], // Testing Mode
     verbose: true,
     ignoreExpired: true,
});

// --- Google Setup ---
const getGoogleAuthClient = async () => {
     const auth = new google.auth.GoogleAuth({
          credentials: {
               client_email: config.iap.google_play_email as string,
               private_key: config.iap.google_play_private_key?.replace(/\\n/g, '\n') as string,
          },
          scopes: ['https://www.googleapis.com/auth/androidpublisher'],
     });
     return await auth.getClient();
};

const androidPublisher = google.androidpublisher('v3');

interface IValidationResult {
     isValid: boolean;
     newExpiryDate: Date | null;
     isTrial: boolean;
     productId?: string;
}

// ==========================================
// 1. Google Validation (Dynamic Package Name)
// ==========================================
export const validateGoogleReceipt = async (
     token: string,
     productId: string,
     packageName: string,
): Promise<IValidationResult> => {
     try {
          const authClient = await getGoogleAuthClient();
          // logger.info('authClient', authClient);
          const response = await androidPublisher.purchases.subscriptions.get({
               auth: authClient as any,
               packageName: packageName,
               subscriptionId: productId,
               token: token,
          });

          const data = response.data;

          if (!data.expiryTimeMillis) {
               return { isValid: false, newExpiryDate: null, isTrial: false };
          }

          const expiryDate = new Date(parseInt(data.expiryTimeMillis));
          const isValid = expiryDate > new Date();
          const isTrial = data.paymentState === 2;

          return {
               isValid,
               newExpiryDate: expiryDate,
               isTrial,
               productId,
          };
     } catch (error: any) {
          errorLogger.error(`Google IAP Error (${packageName}):`, error.message);
          return { isValid: false, newExpiryDate: null, isTrial: false };
     }
};

// ... Apple Validation remains same ...
export const validateAppleReceipt = async (receiptBase64: string): Promise<IValidationResult> => {
     try {
          const products = await appleReceiptVerify.validate({
               receipt: receiptBase64
          });
          return processAppleProducts(products);
     } catch (error: any) {
          errorLogger.error('Apple IAP Error:', error.message);
          return { isValid: false, newExpiryDate: null, isTrial: false };
     }
};

const processAppleProducts = (products: any): IValidationResult => {
     // ... same code as before ...
     if (!Array.isArray(products) || products.length === 0) return { isValid: false, newExpiryDate: null, isTrial: false };
     const latestReceipt = products.sort((a: any, b: any) => b.purchaseDate - a.purchaseDate)[0];
     const expiryDate = new Date(latestReceipt.expirationDate);
     return {
          isValid: expiryDate > new Date(),
          newExpiryDate: expiryDate,
          isTrial: latestReceipt.isTrialPeriod === true || latestReceipt.isTrialPeriod === 'true',
          productId: latestReceipt.productId,
     };
};

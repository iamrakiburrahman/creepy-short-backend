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
     originalTransactionId?: string; // ✅ যোগ করা হয়েছে
}

// ==========================================
// 1. Google Validation (Dynamic Package Name)
// ==========================================
export const validateGoogleReceipt = async (token: string, productId: string, packageName: string): Promise<IValidationResult> => {
     try {
          const authClient = await getGoogleAuthClient();
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

// ==========================================
// 2. Apple Validation
// ==========================================
export const validateAppleReceipt = async (receiptBase64: string): Promise<IValidationResult> => {
     try {
          // JWS format detect করো (dot দিয়ে 3 part)
          const parts = receiptBase64.split('.');

          if (parts.length === 3) {
               // এটা StoreKit 2 JWS token — সরাসরি decode করো
               return decodeAppleJWSTransaction(receiptBase64);
          }

          // পুরনো base64 receipt হলে আগের মতো validate করো
          const products = await appleReceiptVerify.validate({ receipt: receiptBase64 });
          return processAppleProducts(products);
     } catch (error: any) {
          errorLogger.error('Apple IAP Error:', error.message);
          return { isValid: false, newExpiryDate: null, isTrial: false };
     }
};

const decodeAppleJWSTransaction = (jwsToken: string): IValidationResult => {
     try {
          // Middle part (payload) decode করো
          const payload = jwsToken.split('.')[1];

          // Base64URL → Base64 convert করো
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

          errorLogger.info('Apple JWS Decoded:', JSON.stringify(decoded, null, 2));

          const expiryDate = new Date(decoded.expiresDate); // milliseconds
          const isSandbox = decoded.environment === 'Sandbox';

          return {
               isValid: isSandbox ? true : expiryDate > new Date(),
               newExpiryDate: expiryDate,
               isTrial: decoded.offerType === 1, // 1 = free trial
               productId: decoded.productId,
               originalTransactionId: decoded.originalTransactionId, // ✅ যোগ করা হয়েছে
          };
     } catch (err: any) {
          errorLogger.error('JWS Decode Error:', err.message);
          return { isValid: false, newExpiryDate: null, isTrial: false };
     }
};

const processAppleProducts = (products: any): IValidationResult => {
     if (!Array.isArray(products) || products.length === 0) {
          return { isValid: false, newExpiryDate: null, isTrial: false };
     }

     const latestReceipt = products.sort((a: any, b: any) => b.expirationDate - a.expirationDate)[0];

     const expiryDate = new Date(latestReceipt.expirationDate);
     const isSandbox = process.env.NODE_ENV !== 'production';

     return {
          isValid: isSandbox ? true : expiryDate > new Date(),
          newExpiryDate: expiryDate,
          isTrial: latestReceipt.isTrialPeriod === true || latestReceipt.isTrialPeriod === 'true',
          productId: latestReceipt.productId,
          originalTransactionId: latestReceipt.originalTransactionId, // ✅ যোগ করা হয়েছে
     };
};
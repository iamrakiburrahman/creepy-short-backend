import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
     ip_address: process.env.IP_ADDRESS,
     frontend_url: process.env.FRONTEND_URL,
     backend_url: process.env.BACKEND_URL,
     reset_pass_expire_time: process.env.RESET_TOKEN_EXPIRE_TIME,
     database_url: process.env.DATABASE_URL,
     node_env: process.env.NODE_ENV,
     port: process.env.PORT,
     bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
     allowed_origins: process.env.ALLOWED_ORIGINS,
     upload_path: process.env.UPLOAD_PATH,
     jwt: {
          jwt_secret: process.env.JWT_SECRET,
          jwt_expire_in: process.env.JWT_EXPIRE_IN,
          jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
          jwt_refresh_expire_in: process.env.JWT_REFRESH_EXPIRE_IN,
     },
     firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
     },
     server: {
          name: process.env.SERVER_NAME,
     },

     email: {
          email_header: process.env.EMAIL_HEADER_NAME,
          from: process.env.EMAIL_FROM,
          user: process.env.EMAIL_USER,
          port: process.env.EMAIL_PORT,
          host: process.env.EMAIL_HOST,
          pass: process.env.EMAIL_PASS,
     },
     express_session: process.env.EXPRESS_SESSION_SECRET_KEY,
     social: {
          google_client_id: process.env.GOOGLE_CLIENT_ID,
          facebook_client_id: process.env.FACEBOOK_CLIENT_ID,
          google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
          facebook_client_secret: process.env.FACEBOOK_CLIENT_SECRET,
          callback_url: process.env.GOOGLE_CALLBACK_URL,
     },
     redis: {
          password: process.env.REDIS_PASSWORD,
          url: process.env.REDIS_URL,
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          db: process.env.REDIS_DB,
     },
     twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
     },
     stripe: {
          stripe_secret_key: process.env.STRIPE_SECRET_KYE,
          paymentSuccess_url: process.env.STRIPE_PAYMENT_SUCCESS_URL,
          stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
          stripe_webhook_url: process.env.STRIPE_WEBHOOK_URL,
          stripe_product_id: process.env.STRIPE_PRODUCT_ID,
     },
     bunnyCDN: {
          account_api_key: process.env.BUNNY_CDN_ACCOUNT_API_KEY,
          apiKey: process.env.BUNNY_CDN_API_KEY,
          storageZone: process.env.BUNNY_CDN_STORAGE_ZONE,
          hostname: process.env.BUNNY_CDN_STORAGE_HOST_NAME,
          region: process.env.BUNNY_CDN_STORAGE_ZONE_REGION,
          pullZoneUrl: process.env.BUNNY_PULL_ZONE_URL,
          bunny_token: process.env.BUNNY_TOKEN_AUTHENTICATION,
          stream_api_key: process.env.BUNNY_STREAM_API_KEY,
          stream_library_id: process.env.BUNNY_STREAM_LIBRARY_ID,
          pull_zone_host: process.env.BUNNY_STREAM_PULL_ZONE_HOST,
          stream_cdn_hostname: process.env.BUNNY_STREAM_CDN_HOSTNAME,
          token_auth_key: process.env.BUNNY_TOKEN_AUTH_KEY,
     },
     super_admin: {
          email: process.env.SUPER_ADMIN_EMAIL,
          password: process.env.SUPER_ADMIN_PASSWORD,
     },
};

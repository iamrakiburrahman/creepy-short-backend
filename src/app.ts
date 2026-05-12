import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import session from 'express-session';
import path from 'path';
import authOptional from './app/middleware/authOptional';
import { notFound } from './app/middleware/notFound';
import { VideoManagementController } from './app/modules/videoManagement/videoManagement.controller';
import config from './config';
import { corsOptions, generalLimiter, getSessionConfig } from './DB/security';
import globalErrorHandler from './globalErrorHandler/globalErrorHandler';
import handleAppleWebhook from './helpers/iasWebHook/appleWebhook';
import handleGoogleWebhook from './helpers/iasWebHook/googleWebhook';
import router from './routes';
import { Morgan } from './shared/morgen';
import setupTimeManagement from './utils/cronJobs';
import getUploadDirectory from './utils/getUploadDirectory';
import { welcome } from './utils/welcome';

const app: Application = express();
const isProd = config.node_env === 'production';
if (isProd) {
     app.set('trust proxy', 1);
} else {
     app.set('trust proxy', 'loopback');
}
/* =====================================================
   Apple App Site Association (AASA) - Universal Links
===================================================== */
app.get('/.well-known/apple-app-site-association', (req: Request, res: Response) => {
     const aasaContent = {
          applinks: {
               apps: [],
               details: [
                    {
                         appID: '474QT7LGUB.com.rubengalindo.creepyshorts',
                         paths: ['/shorts', '/shorts/*'],
                    },
               ],
          },
     };
     res.type('application/json');
     res.status(200).json(aasaContent);
});
/* =====================================================
   Android Asset Links
===================================================== */
app.get('/.well-known/assetlinks.json', (req: Request, res: Response) => {
     const assetLinksContent = [
          {
               relation: ['delegate_permission/common.handle_all_urls'],
               target: {
                    namespace: 'android_app',
                    package_name: 'com.rubengalindo.creepyshorts',
                    sha256_cert_fingerprints: [],
               },
          },
     ];
     res.type('application/json');
     res.status(200).json(assetLinksContent);
});
/* =====================================================
   Share Video Link Handler (for Universal Links/App Links)
===================================================== */
app.get('/shorts/:videoId', authOptional(), VideoManagementController.getShareVideo);
/* =====================================================
   Apple webhook (MUST BE FIRST)
===================================================== */
app.post('/api/v1/webhooks/apple', express.json(), handleAppleWebhook);
/* =====================================================
   Google webhook (MUST BE FIRST)
===================================================== */
app.post('/api/v1/webhooks/google', express.json(), handleGoogleWebhook);
// ==========================================
// VIEW ENGINE (EJS)
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// LOGGING (Morgan)
// ==========================================
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

// ==========================================
// CORS CONFIGURATION
// ==========================================
export const allowedOrigins = config.node_env === 'production' ? config.allowed_origins?.split(',') || [] : '*';

app.use(cors(corsOptions));

// ==========================================
// BODY PARSERS
// ==========================================
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// SESSION (OAuth)
// ===========================================
app.use(session(getSessionConfig()));

// ==========================================
// STATIC FILES (Uploads)
// ==========================================
const baseUploadDir = getUploadDirectory();

app.use(
     express.static(baseUploadDir, {
          maxAge: config.node_env === 'production' ? '7d' : 0,
          etag: true,
          lastModified: true,
          setHeaders: (res, filePath) => {
               // Security headers
               res.setHeader('X-Content-Type-Options', 'nosniff');
               res.setHeader('X-Frame-Options', 'DENY');
               res.setHeader('Cache-Control', 'public, max-age=604800');

               // Set appropriate content types
               if (filePath.endsWith('.pdf')) {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'inline');
               } else if (filePath.match(/\.(jpg|jpeg)$/i)) {
                    res.setHeader('Content-Type', 'image/jpeg');
               } else if (filePath.endsWith('.png')) {
                    res.setHeader('Content-Type', 'image/png');
               } else if (filePath.endsWith('.webp')) {
                    res.setHeader('Content-Type', 'image/webp');
               } else if (filePath.endsWith('.svg')) {
                    res.setHeader('Content-Type', 'image/svg+xml');
               }
          },
     }),
);

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get('/health', (req: Request, res: Response) => {
     res.status(200).json({
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          pid: process.pid,
          memory: process.memoryUsage(),
          environment: config.node_env,
     });
});

// ==========================================
// API ROUTES (With Rate Limiting)
// ==========================================
app.use('/api/v1', generalLimiter, router);

// ==========================================
// ROOT ENDPOINT
// ==========================================
app.get('/', async (req: Request, res: Response) => {
     const result = await welcome();
     res.send(result);
});

// ==========================================
// ERROR HANDLING
// ==========================================
app.use(globalErrorHandler);

// ==========================================
// 404 HANDLER (Must be last)
// ==========================================
app.use(notFound);

// ==========================================
// CRON JOBS
// ==========================================
setupTimeManagement();

export default app;

import { createServer, Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import colors from 'colors';
import { validateConfig } from './DB/configValidation';
import { connectToDatabase } from './DB/db';
import app, { allowedOrigins } from './app';
import config from './config';
import { logger } from './shared/logger';
import { socketHelper } from './helpers/socketHelper';
import { setupProcessHandlers } from './DB/processHandlers';
import { setupSecurity } from './DB/security';
import { connectToRedis } from './DB/redis';
import { setupQueueEvents, setupWorkerEvents } from './DB/bullMQ';
import { startRealtimeMonitoring } from './scripts/startRealtimeMonitoring';

export let httpServer: HttpServer;
export let socketServer: SocketServer;

async function startServer(): Promise<void> {
     try {
          // Validate config first
          validateConfig();

          // Connect to database
          await connectToDatabase();

          // Create HTTP server
          httpServer = createServer(app);
          const httpPort = Number(config.port);
          const ipAddress = config.ip_address as string;

          // Set timeouts
          httpServer.timeout = 120000;
          httpServer.keepAliveTimeout = 5000;
          httpServer.headersTimeout = 60000;

          // Start HTTP server
          await new Promise<void>((resolve, reject) => {
               httpServer.listen(httpPort, ipAddress, () => {
                    logger.info(colors.bgCyan.bold.white(`♻️  Server (PID: ${process.pid}) listening on http://${ipAddress}:${httpPort}`));
                    resolve();
               });
               httpServer.on('error', reject);
          });

          // Set up Socket.io server
          socketServer = new SocketServer(httpServer, {
               cors: {
                    origin: allowedOrigins || '*',
                    credentials: true,
               },
               pingTimeout: 60000,
               pingInterval: 25000,
          });

          socketHelper.socket(socketServer);

          (global as any).io = socketServer;

          logger.info(colors.bgYellow(`♻️  Socket.IO ready on PID ${process.pid}`));
     } catch (error) {
          logger.error(colors.red(`Server (PID: ${process.pid}) failed to start:`), error);
          throw error;
     }
}
// ==========================================
// ENTRY POINT - Runs once at startup
// ==========================================
async function main() {
     try {
          // Setup security headers
          setupSecurity();
          // Setup graceful shutdown handlers
          setupProcessHandlers();
          // Start the server
          await startServer();
          // Connect to Redis
          await connectToRedis();
          // Setup BullMQ events
          setupQueueEvents();
          setupWorkerEvents();
          // Start monitoring (only in production)
          if (config.node_env === 'production') {
               startRealtimeMonitoring();
          }
          logger.info(colors.green.bold(`✅ Server bootstrap completed successfully (PID: ${process.pid})`));
     } catch (error) {
          logger.error(colors.red('❌ Bootstrap failed:'), error);
          process.exit(1);
     }
}
main();

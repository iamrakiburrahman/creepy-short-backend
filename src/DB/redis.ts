import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import colors from 'colors';
import { logger, errorLogger } from '../shared/logger';
import config from '../config';

let redisClient: RedisClientType | null = null;
let isRedisConnected = false;

// Redis configuration
const REDIS_CONFIG: RedisClientOptions = {
     url: config.redis.url || 'redis://localhost:6379',
     socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries: number) => {
               if (retries > 10) {
                    errorLogger.error(colors.red('Redis: Too many reconnection attempts'));
                    return new Error('Redis reconnection failed');
               }
               const delay = Math.min(retries * 100, 3000);
               logger.info(colors.yellow(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`));
               return delay;
          },
     },
     database: config.redis.db ? Number(config.redis.db) : 0,
};

// Connect to Redis
export async function connectToRedis() {
     try {
          // You can specify the correct type for Redis client based on the Redis modules you are using (e.g., RedisGraph)
          redisClient = createClient(REDIS_CONFIG) as RedisClientType; // Explicitly casting to RedisClientType

          // Setup event listeners
          setupRedisListeners();

          // Connect
          await redisClient.connect();
          isRedisConnected = true;
          logger.info(colors.bgBlue.white('🚀 Redis connected successfully'));
     } catch (error) {
          errorLogger.error(colors.red('Redis connection error:'), error);
          isRedisConnected = false;
          // Don't exit - Redis is optional for many apps
          logger.warn(colors.yellow('⚠️  Application starting without Redis cache'));
     }
}

// Setup Redis event listeners
function setupRedisListeners(): void {
     if (!redisClient) return;

     redisClient.on('connect', () => {
          logger.info(colors.bgGreen.white('Redis: Connection established'));
     });

     redisClient.on('ready', () => {
          isRedisConnected = true;
          logger.info(colors.bgGreen.white('Redis: Ready to accept commands'));
     });

     redisClient.on('error', (err) => {
          isRedisConnected = false;
          errorLogger.error(colors.red('Redis error:'), err);
     });

     redisClient.on('reconnecting', () => {
          isRedisConnected = false;
          logger.warn(colors.yellow('Redis: Attempting to reconnect...'));
     });

     redisClient.on('end', () => {
          isRedisConnected = false;
          logger.warn(colors.yellow('Redis: Connection closed'));
     });
}

// Disconnect from Redis
export async function disconnectRedis(): Promise<void> {
     if (redisClient && isRedisConnected) {
          try {
               await redisClient.quit();
               logger.info(colors.green('✅ Redis disconnected gracefully'));
          } catch (error) {
               errorLogger.error(colors.red('Error disconnecting Redis:'), error);
               // Force disconnect if quit fails
               await redisClient.disconnect();
          }
     }
}

// Get Redis client
export function getRedisClient(): RedisClientType | null {
     return isRedisConnected ? redisClient : null;
}

// Check if Redis is connected
export function isRedisReady(): boolean {
     return isRedisConnected && redisClient !== null;
}

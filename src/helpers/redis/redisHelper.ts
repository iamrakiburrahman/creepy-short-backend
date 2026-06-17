import { getRedisClient, isRedisReady } from '../../DB/redis';
import { errorLogger, logger } from '../../shared/logger';
import colors from 'colors';

// Utility function to check if Redis is available
const isRedisAvailable = async (): Promise<boolean> => {
     if (!isRedisReady()) {
          errorLogger.error(colors.red('Redis is not ready.'));
          return false;
     }
     return true;
};

// Utility function to serialize a value
const serialize = (value: any): string => JSON.stringify(value);
// Utility function to deserialize a value
const deserialize = <T>(value: string): T => JSON.parse(value) as T;

// Set value in cache
const setCache = async (
     key: string,
     value: any,
     expirationInSeconds: number = 3600,
): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          const serializedValue = serialize(value);
          await getRedisClient()!.setEx(key, expirationInSeconds, serializedValue);
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Redis SET error for key "${key}":`), error);
          return false;
     }
};

// Get value from cache
const getCache = async <T>(key: string): Promise<T | null> => {
     if (!(await isRedisAvailable())) return null;
     try {
          const value = await getRedisClient()!.get(key);
          if (!value) return null;
          return deserialize(value); // Use the deserialize utility
     } catch (error) {
          errorLogger.error(colors.red(`Redis GET error for key "${key}":`), error);
          return null;
     }
};

// Delete value from cache
const deleteCache = async (key: string): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          await getRedisClient()!.del(key);
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Redis DEL error for key "${key}":`), error);
          return false;
     }
};

// Delete multiple keys matching a pattern
const deleteCachePattern = async (pattern: string): Promise<number> => {
     if (!(await isRedisAvailable())) return 0;
     try {
          const keys = await getRedisClient()!.keys(pattern);
          if (keys.length === 0) return 0;
          await getRedisClient()!.del(keys);
          return keys.length;
     } catch (error) {
          errorLogger.error(colors.red(`Redis DEL pattern error for "${pattern}":`), error);
          return 0;
     }
};

// Check if a key exists in cache
const existsCache = async (key: string): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          const exists = await getRedisClient()!.exists(key);
          return exists === 1;
     } catch (error) {
          errorLogger.error(colors.red(`Redis EXISTS error for key "${key}":`), error);
          return false;
     }
};

// Set expiration on an existing key
const expireCache = async (key: string, seconds: number): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          await getRedisClient()!.expire(key, seconds);
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Redis EXPIRE error for key "${key}":`), error);
          return false;
     }
};

// Increment value in cache
const incrementCache = async (key: string, amount: number = 1): Promise<number | null> => {
     if (!(await isRedisAvailable())) return null;
     try {
          const value = await getRedisClient()!.incrBy(key, amount);
          return value;
     } catch (error) {
          errorLogger.error(colors.red(`Redis INCR error for key "${key}":`), error);
          return null;
     }
};

// Get TTL (Time to Live) of a key
const getTTL = async (key: string): Promise<number | null> => {
     if (!(await isRedisAvailable())) return null;
     try {
          const ttl = await getRedisClient()!.ttl(key);
          return ttl;
     } catch (error) {
          errorLogger.error(colors.red(`Redis TTL error for key "${key}":`), error);
          return null;
     }
};

// Flush all Redis data (use with caution!)
const flushAllCache = async (): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          await getRedisClient()!.flushAll();
          logger.warn(colors.yellow('⚠️  All Redis cache cleared!'));
          return true;
     } catch (error) {
          errorLogger.error(colors.red('Redis FLUSHALL error:'), error);
          return false;
     }
};

export const RedisCacheHelper = {
     setCache,
     getCache,
     deleteCache,
     deleteCachePattern,
     existsCache,
     expireCache,
     incrementCache,
     getTTL,
     flushAllCache,
};

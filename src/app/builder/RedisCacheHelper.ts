import { RedisCacheHelper } from '../../helpers/redis/redisHelper';
import { logger } from '../../shared/logger';

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
     SHORT: 300, // 5 minutes
     MEDIUM: 600, // 10 minutes
     LONG: 1800, // 30 minutes
     VERY_LONG: 3600, // 1 hour
};

class RedisCacheBuilder {
     private entityName: string;

     constructor(entityName: string) {
          this.entityName = entityName.toLowerCase();
     }

     // Generate cache key for list queries
     private getListKey(query: Record<string, unknown>): string {
          const queryString = JSON.stringify(query);
          return `${this.entityName}:list:${queryString}`;
     }

     // Generate cache key for single item
     private getSingleKey(id: string): string {
          return `${this.entityName}:${id}`;
     }

     // Generate cache key for custom data
     private getCustomKey(suffix: string): string {
          return `${this.entityName}:${suffix}`;
     }

     // Wrapper for LIST operations (allUsers, allProducts, etc.)
     async wrapList<T>(
          query: Record<string, unknown>,
          originalFunction: () => Promise<T>,
          ttl: number = CACHE_TTL.SHORT,
     ): Promise<T> {
          const cacheKey = this.getListKey(query);

          // Check cache
          const cached = await RedisCacheHelper.getCache<T>(cacheKey);
          if (cached) {
               logger.info(`✅ Cache HIT: ${cacheKey}`);
               return cached;
          }
          logger.info(`❌ Cache MISS: ${cacheKey} - Fetching from DB`);
          const result = await originalFunction();

          const setSuccess = await RedisCacheHelper.setCache(cacheKey, result, ttl);
          if (!setSuccess) {
               logger.error(`Failed to cache data for key: ${cacheKey}`);
          }
          logger.info(`💾 Cached: ${cacheKey}`);
          return result;
     }

     // Wrapper for SINGLE item operations (getUser, getProduct, etc.)
     async wrapSingle<T>(
          id: string,
          originalFunction: () => Promise<T>,
          ttl: number = CACHE_TTL.MEDIUM,
     ): Promise<T> {
          const cacheKey = this.getSingleKey(id);

          // Check cache
          const cached = await RedisCacheHelper.getCache<T>(cacheKey);
          if (cached) {
               logger.info(`✅ Cache HIT: ${cacheKey}`);
               return cached;
          }

          logger.info(`❌ Cache MISS: ${cacheKey} - Fetching from DB`);
          const result = await originalFunction();

          const setSuccess = await RedisCacheHelper.setCache(cacheKey, result, ttl);
          if (!setSuccess) {
               logger.error(`Failed to cache data for key: ${cacheKey}`);
          }
          logger.info(`💾 Cached: ${cacheKey}`);
          return result;
     }

     // Wrapper for CUSTOM operations (featured, trending, etc.)
     async wrapCustom<T>(
          suffix: string,
          originalFunction: () => Promise<T>,
          ttl: number = CACHE_TTL.MEDIUM,
     ): Promise<T> {
          const cacheKey = this.getCustomKey(suffix);

          // Check cache
          const cached = await RedisCacheHelper.getCache<T>(cacheKey);
          if (cached) {
               logger.info(`✅ Cache HIT: ${cacheKey}`);
               return cached;
          }
          logger.info(`❌ Cache MISS: ${cacheKey} - Fetching from DB`);
          const result = await originalFunction();

          const setSuccess = await RedisCacheHelper.setCache(cacheKey, result, ttl);
          if (!setSuccess) {
               logger.error(`Failed to cache data for key: ${cacheKey}`);
          }
          logger.info(`💾 Cached: ${cacheKey}`);
          return result;
     }

     // Clear cache after UPDATE/DELETE operations
     async clearAfterUpdate(id: string): Promise<void> {
          // Clear single item cache
          await RedisCacheHelper.deleteCache(this.getSingleKey(id));
          // Clear all list caches
          await RedisCacheHelper.deleteCachePattern(`${this.entityName}:list:*`);
          logger.info(`🗑️  Cache cleared for ${this.entityName}:${id} and all lists`);
     }

     // Clear all caches for this entity
     async clearAll(): Promise<void> {
          const deletedCount = await RedisCacheHelper.deleteCachePattern(`${this.entityName}*`);
          logger.info(`🗑️  All cache cleared for ${this.entityName} (${deletedCount} keys)`);
     }

     // Clear only list caches (after CREATE operations)
     async clearLists(): Promise<void> {
          const deletedCount = await RedisCacheHelper.deleteCachePattern(
               `${this.entityName}:list:*`,
          );
          logger.info(`🗑️  List cache cleared for ${this.entityName} (${deletedCount} keys)`);
     }
}

export const createCacheHelper = (entityName: string) => {
     return new RedisCacheBuilder(entityName);
};

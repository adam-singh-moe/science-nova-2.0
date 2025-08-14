import { createServerClient } from './supabase-server'

// Enhanced in-memory cache with persistence fallback for testing phase
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class MemoryCacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly maxSize = 500
  private readonly defaultTTL = 1000 * 60 * 30 // 30 minutes

  private cleanupOldEntries() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
      }
    }

    // LRU eviction if cache is too large
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, entries.length - this.maxSize)
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cleanupOldEntries()
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }
    
    // Update timestamp for LRU
    entry.timestamp = Date.now()
    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRatio: this.getHitRatio()
    }
  }

  private hits = 0
  private misses = 0

  private getHitRatio(): number {
    const total = this.hits + this.misses
    return total > 0 ? this.hits / total : 0
  }

  // Enhanced get with hit/miss tracking
  getWithStats<T>(key: string): T | null {
    const result = this.get<T>(key)
    if (result !== null) {
      this.hits++
    } else {
      this.misses++
    }
    return result
  }
}

// Database-backed cache for persistence across restarts
class DatabaseCacheManager {
  private memoryCache = new MemoryCacheManager()
  private supabase = createServerClient()

  async get<T>(key: string, fallbackFn?: () => Promise<T>): Promise<T | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.getWithStats<T>(key)
    if (memoryResult !== null) {
      return memoryResult
    }

    try {
      // Check database cache
      const { data } = await this.supabase
        .from('query_embedding_cache')
        .select('cached_result, expires_at')
        .eq('query_hash', key)
        .single()

      if (data && new Date(data.expires_at) > new Date()) {
        const result = JSON.parse(data.cached_result)
        // Store in memory for faster access
        this.memoryCache.set(key, result)
        return result
      }
    } catch (error) {
      console.warn('Database cache read failed:', error)
    }

    // If fallback function provided, execute and cache result
    if (fallbackFn) {
      try {
        const result = await fallbackFn()
        await this.set(key, result)
        return result
      } catch (error) {
        console.error('Fallback function failed:', error)
        return null
      }
    }

    return null
  }

  async set<T>(key: string, data: T, ttl = 1000 * 60 * 30): Promise<void> {
    // Store in memory cache
    this.memoryCache.set(key, data, ttl)

    try {
      // Store in database cache for persistence
      const expiresAt = new Date(Date.now() + ttl)
      await this.supabase
        .from('query_embedding_cache')
        .upsert({
          query_hash: key,
          cached_result: JSON.stringify(data),
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Database cache write failed:', error)
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)
    try {
      await this.supabase
        .from('query_embedding_cache')
        .delete()
        .eq('query_hash', key)
    } catch (error) {
      console.warn('Database cache delete failed:', error)
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear()
    try {
      await this.supabase
        .from('query_embedding_cache')
        .delete()
        .neq('query_hash', '')
    } catch (error) {
      console.warn('Database cache clear failed:', error)
    }
  }

  getStats() {
    return this.memoryCache.getStats()
  }
}

// Content-specific caching
export class ContentCacheManager extends DatabaseCacheManager {
  async getCachedContent(topicId: string, userId: string): Promise<any | null> {
    const key = `content:${topicId}:${userId}`
    return this.get(key)
  }

  async setCachedContent(topicId: string, userId: string, content: any, ttl = 1000 * 60 * 60 * 24): Promise<void> {
    const key = `content:${topicId}:${userId}`
    await this.set(key, content, ttl) // 24 hour cache for generated content
  }

  async getCachedEmbedding(queryHash: string): Promise<number[] | null> {
    const key = `embedding:${queryHash}`
    return this.get(key)
  }

  async setCachedEmbedding(queryHash: string, embedding: number[], ttl = 1000 * 60 * 60 * 6): Promise<void> {
    const key = `embedding:${queryHash}`
    await this.set(key, embedding, ttl) // 6 hour cache for embeddings
  }

  async getCachedSearchResults(queryHash: string): Promise<any[] | null> {
    const key = `search:${queryHash}`
    return this.get(key)
  }

  async setCachedSearchResults(queryHash: string, results: any[], ttl = 1000 * 60 * 60 * 2): Promise<void> {
    const key = `search:${queryHash}`
    await this.set(key, results, ttl) // 2 hour cache for search results
  }
}

// Singleton instance
export const cacheManager = new ContentCacheManager()

// Response caching headers for CDN-like behavior
export function createCacheHeaders(maxAge = 3600, staleWhileRevalidate = 86400) {
  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    'CDN-Cache-Control': `public, max-age=${maxAge}`,
    'Vercel-CDN-Cache-Control': `public, max-age=${maxAge}`,
  }
}

// Background cache warming
export async function warmCache() {
  try {
    // Warm up common queries
    const supabase = createServerClient()
    
    // Get popular topics
    const { data: popularTopics } = await supabase
      .from('topics')
      .select('id, title')
      .limit(10)

    if (popularTopics) {
      console.log(`Warming cache for ${popularTopics.length} popular topics`)
      // Pre-generate embeddings for popular topics
      for (const topic of popularTopics) {
        const queryHash = `popular:${topic.id}`
        // This would trigger embedding generation and caching
      }
    }
  } catch (error) {
    console.warn('Cache warming failed:', error)
  }
}

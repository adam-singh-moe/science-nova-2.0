#!/usr/bin/env node

/**
 * Cache Warming Script for Science Nova
 * 
 * This script pre-generates and caches content for popular topics
 * to improve response times for common user requests.
 * 
 * Usage:
 * - npm run warm-cache (for production deployment)
 * - node scripts/warm-cache.js (direct execution)
 */

import { createServerClient } from '../lib/supabase-optimized.js'
import { cacheManager } from '../lib/cache-manager.js'
import { searchRelevantTextbookContent } from '../lib/textbook-search-optimized.js'

async function warmCache() {
  console.log('🔥 Starting cache warming process...')
  
  try {
    const supabase = createServerClient('cache-warming')
    
    // Get popular topics (most viewed or recently created)
    console.log('📊 Fetching popular topics...')
    const { data: popularTopics, error } = await supabase
      .from('topics')
      .select(`
        id, 
        title, 
        grade_level,
        study_areas (name)
      `)
      .limit(20)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    if (!popularTopics || popularTopics.length === 0) {
      console.log('⚠️ No topics found for cache warming')
      return
    }
    
    console.log(`🎯 Found ${popularTopics.length} topics to warm`)
    
    // Get sample users for different grade levels
    const { data: sampleUsers } = await supabase
      .from('profiles')
      .select('id, grade_level, learning_preference')
      .in('grade_level', [1, 2, 3, 4, 5, 6])
      .limit(6)
    
    const usersByGrade = new Map()
    sampleUsers?.forEach(user => {
      if (!usersByGrade.has(user.grade_level)) {
        usersByGrade.set(user.grade_level, user.id)
      }
    })
    
    // Warm cache for each topic-user combination
    let warmedCount = 0
    let errorCount = 0
    
    for (const topic of popularTopics) {
      console.log(`🔄 Warming cache for topic: ${topic.title}`)
      
      // Get or create user ID for this grade level
      const gradeLevel = topic.grade_level || 3
      let userId = usersByGrade.get(gradeLevel)
      
      if (!userId) {
        // Use first available user as fallback
        userId = Array.from(usersByGrade.values())[0]
      }
      
      if (!userId) {
        console.log('⚠️ No sample users found, skipping topic')
        continue
      }
      
      try {
        // Pre-cache textbook search results
        const studyAreaName = topic.study_areas?.name || 'Science'
        await searchRelevantTextbookContent({
          query: topic.title,
          gradeLevel: gradeLevel,
          studyArea: studyAreaName,
          topicTitle: topic.title,
          maxResults: 6,
          minSimilarity: 0.65
        })
        
        // Note: We don't pre-generate full content here as it's expensive
        // Instead, we cache the search results which are the most expensive part
        
        warmedCount++
        console.log(`✅ Warmed cache for topic ${topic.id} (${warmedCount}/${popularTopics.length})`)
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to warm cache for topic ${topic.id}:`, error)
      }
    }
    
    // Warm common search queries
    console.log('🔍 Warming common search query embeddings...')
    const commonQueries = [
      'photosynthesis plants energy light',
      'water cycle evaporation precipitation',
      'solar system planets space astronomy',
      'magnetism magnetic force field',
      'electricity current circuit voltage',
      'forces motion gravity acceleration',
      'matter states solid liquid gas',
      'ecosystems food chain predator prey',
      'weather climate temperature pressure',
      'human body systems organs functions'
    ]
    
    let queryCount = 0
    for (const query of commonQueries) {
      for (let grade = 1; grade <= 6; grade++) {
        try {
          await searchRelevantTextbookContent({
            query: query,
            gradeLevel: grade,
            studyArea: 'Science',
            maxResults: 3,
            minSimilarity: 0.6
          })
          queryCount++
        } catch (error) {
          console.error(`❌ Failed to warm query "${query}" for grade ${grade}:`, error)
        }
      }
    }
    
    // Get cache statistics
    const cacheStats = cacheManager.getStats()
    
    console.log('\n🎉 Cache warming completed!')
    console.log(`📈 Results:`)
    console.log(`   - Topics processed: ${warmedCount}/${popularTopics.length}`)
    console.log(`   - Queries processed: ${queryCount}/${commonQueries.length * 6}`)
    console.log(`   - Errors: ${errorCount}`)
    console.log(`   - Cache size: ${cacheStats.size} entries`)
    console.log(`   - Cache hit ratio: ${(cacheStats.hitRatio * 100).toFixed(1)}%`)
    
    // Log warming completion to database
    await supabase
      .from('api_performance_metrics')
      .insert({
        endpoint: 'cache-warming',
        cache_hit: false,
        response_time: Date.now(),
        metadata: {
          topics_warmed: warmedCount,
          queries_warmed: queryCount,
          errors: errorCount,
          cache_stats: cacheStats
        },
        created_at: new Date().toISOString()
      })
    
  } catch (error) {
    console.error('💥 Cache warming failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  warmCache()
    .then(() => {
      console.log('✨ Cache warming script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Cache warming script failed:', error)
      process.exit(1)
    })
}

export { warmCache }

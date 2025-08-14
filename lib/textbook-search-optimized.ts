import { generateEmbeddings } from './textbook-processor'
import { createServerClient, parallelQuery } from './supabase-optimized'
import { cacheManager } from './cache-manager'
import crypto from 'crypto'

export interface RelevantContent {
  id: string
  content: string
  metadata: any
  similarity: number
}

export interface SearchParams {
  query: string
  gradeLevel: number
  studyArea?: string
  topicTitle?: string
  maxResults?: number
  minSimilarity?: number
}

// Cache for in-memory frequent queries (LRU cache)
const queryCache = new Map<string, { embedding: number[], timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes
const MAX_CACHE_SIZE = 100

// Function to create a comprehensive search query from topic/adventure metadata
function createSearchQuery(params: SearchParams): string {
  const parts = [params.query]
  
  if (params.topicTitle) {
    parts.push(params.topicTitle)
  }
  if (params.studyArea) {
    parts.push(params.studyArea)
  }
  
  // Add common educational terms to improve search
  parts.push(`grade ${params.gradeLevel} science education curriculum`)
  
  return parts.join(' ')
}

// Generate query hash for caching
function generateQueryHash(query: string): string {
  return crypto.createHash('sha256').update(query).digest('hex')
}

// Clean up old cache entries
function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key)
    }
  }
  
  // If still too large, remove oldest entries
  if (queryCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(queryCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE)
    toRemove.forEach(([key]) => queryCache.delete(key))
  }
}

// Get or generate query embedding with multiple cache layers
async function getQueryEmbedding(searchQuery: string, gradeLevel: number, studyArea?: string): Promise<number[]> {
  const queryHash = generateQueryHash(searchQuery)
  
  // Check in-memory cache first (fastest)
  const cached = queryCache.get(queryHash)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Using in-memory cached embedding')
    return cached.embedding
  }
  
  const supabase = createServerClient()
  
  // Check database cache
  const { data: cachedEmbedding } = await supabase
    .from('query_embedding_cache')
    .select('embedding')
    .eq('query_hash', queryHash)
    .single()
  
  if (cachedEmbedding) {
    console.log('Using database cached embedding')
    
    // Update usage statistics asynchronously
    supabase.rpc('update_query_cache_usage', { hash_value: queryHash }).then()
    
    // Store in memory cache
    queryCache.set(queryHash, { 
      embedding: cachedEmbedding.embedding, 
      timestamp: Date.now() 
    })
    
    return cachedEmbedding.embedding
  }
  
  // Generate new embedding
  console.log('Generating new embedding for query')
  const queryEmbeddings = await generateEmbeddings([searchQuery])
  const queryEmbedding = queryEmbeddings[0]
  
  // Store in database cache asynchronously
  supabase
    .from('query_embedding_cache')
    .upsert({
      query_hash: queryHash,
      query_text: searchQuery,
      embedding: queryEmbedding,
      grade_level: gradeLevel,
      study_area: studyArea
    })
    .then()
  
  // Store in memory cache
  queryCache.set(queryHash, { 
    embedding: queryEmbedding, 
    timestamp: Date.now() 
  })
  
  // Cleanup old entries periodically
  cleanupCache()
  
  return queryEmbedding
}

// Optimized main search function with batch operations
export async function searchRelevantTextbookContent(
  params: SearchParams
): Promise<RelevantContent[]> {
  try {
    const supabase = createServerClient()
    
    // Create comprehensive search query
    const searchQuery = createSearchQuery(params)
    console.log(`Searching textbook content for: "${searchQuery}"`)
    
    // Get embedding with caching
    const queryEmbedding = await getQueryEmbedding(searchQuery, params.gradeLevel, params.studyArea)
    
    // Optimized database search with minimal data transfer
    const { data: results, error } = await supabase.rpc('search_similar_textbook_content', {
      query_embedding: queryEmbedding,
      grade_filter: params.gradeLevel,
      match_threshold: params.minSimilarity || 0.6,
      match_count: params.maxResults || 15
    })
    
    if (error) {
      console.error('Error searching textbook content:', error)
      throw error
    }
    
    if (!results || results.length === 0) {
      console.log(`No relevant textbook content found for grade ${params.gradeLevel}`)
      return []
    }
    
    console.log(`Found ${results.length} relevant textbook chunks`)
    
    return results.map((result: any) => ({
      id: result.id,
      content: result.content,
      metadata: result.metadata,
      similarity: result.similarity
    }))
    
  } catch (error) {
    console.error('Error in searchRelevantTextbookContent:', error)
    return []
  }
}

// Optimized content formatting with intelligent truncation
export function formatTextbookContentForPrompt(
  relevantContent: RelevantContent[],
  maxContentLength: number = 3000 // Reduced from 4000 for better performance
): string {
  if (relevantContent.length === 0) {
    return ''
  }
  
  // Sort by similarity (highest first)
  const sortedContent = relevantContent.sort((a, b) => b.similarity - a.similarity)
  
  let formattedContent = 'REFERENCE TEXTBOOK CONTENT:\n\n'
  let currentLength = formattedContent.length
  let chunksIncluded = 0
  
  for (const content of sortedContent) {
    // Truncate individual chunks if they're too long
    const truncatedContent = content.content.length > 800 
      ? content.content.substring(0, 800) + '...'
      : content.content
    
    const contentSection = `[Ref ${chunksIncluded + 1} - ${(content.similarity * 100).toFixed(1)}%]\n${truncatedContent}\n\n`
    
    if (currentLength + contentSection.length > maxContentLength) {
      break
    }
    
    formattedContent += contentSection
    currentLength += contentSection.length
    chunksIncluded++
    
    // Limit to top 5 chunks for performance
    if (chunksIncluded >= 5) break
  }
  
  formattedContent += `INSTRUCTIONS: Use the above ${chunksIncluded} textbook references as primary sources. Maintain accuracy while adapting to student needs.\n\n`
  
  return formattedContent
}

// Batch operation for multiple searches (for adventure generation)
export async function batchSearchTextbookContent(
  searchParams: SearchParams[]
): Promise<RelevantContent[][]> {
  const promises = searchParams.map(params => searchRelevantTextbookContent(params))
  return Promise.all(promises)
}

// Precompute embeddings for common queries
export async function precomputeCommonQueries(): Promise<void> {
  const commonQueries = [
    'photosynthesis plants energy',
    'water cycle evaporation precipitation',
    'solar system planets space',
    'magnetism magnetic force',
    'electricity current circuit',
    'forces motion gravity',
    'matter states solid liquid gas',
    'ecosystems food chain animals',
    'weather climate temperature',
    'human body systems organs'
  ]
  
  console.log('Precomputing embeddings for common queries...')
  
  for (const query of commonQueries) {
    for (let grade = 1; grade <= 6; grade++) {
      await getQueryEmbedding(query, grade, 'Science')
    }
  }
  
  console.log('Precomputation completed')
}

// Function to get textbook content statistics with caching
export async function getTextbookContentStats(): Promise<{
  totalChunks: number
  chunksByGrade: Record<number, number>
  lastProcessed: Record<number, string>
}> {
  try {
    const supabase = createServerClient()
    
    // Use a single query with aggregation for better performance
    const { data: stats, error } = await supabase
      .from('textbook_embeddings')
      .select('grade_level, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    const chunksByGrade: Record<number, number> = {}
    const lastProcessed: Record<number, string> = {}
    
    for (const stat of stats || []) {
      const grade = stat.grade_level
      chunksByGrade[grade] = (chunksByGrade[grade] || 0) + 1
      
      if (!lastProcessed[grade]) {
        lastProcessed[grade] = stat.created_at
      }
    }
    
    return {
      totalChunks: stats?.length || 0,
      chunksByGrade,
      lastProcessed
    }
    
  } catch (error) {
    console.error('Error fetching textbook stats:', error)
    return {
      totalChunks: 0,
      chunksByGrade: {},
      lastProcessed: {}
    }
  }
}

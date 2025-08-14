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

// Generate query hash for caching
function generateQueryHash(query: string): string {
  return crypto.createHash('sha256').update(query).digest('hex')
}

// Create search terms from parameters
function createSearchTerms(params: SearchParams): string[] {
  const terms = []
  
  // Add main query terms
  terms.push(...params.query.toLowerCase().split(' ').filter(term => term.length > 2))
  
  if (params.topicTitle) {
    terms.push(...params.topicTitle.toLowerCase().split(' ').filter(term => term.length > 2))
  }
  
  if (params.studyArea) {
    terms.push(params.studyArea.toLowerCase())
  }
  
  // Add grade-specific terms
  terms.push('grade', params.gradeLevel.toString(), 'science', 'education')
  
  // Remove duplicates and common words
  const filtered = [...new Set(terms)].filter(term => 
    !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(term)
  )
  
  return filtered
}

// Text-based search for Supabase Free Tier (no vector indexes)
export async function searchRelevantTextbookContent(params: SearchParams): Promise<RelevantContent[]> {
  const searchQuery = params.query + ' ' + (params.topicTitle || '') + ' ' + (params.studyArea || '')
  const queryHash = generateQueryHash(searchQuery)
  
  // Check cache first
  const cachedResults = await cacheManager.getCachedSearchResults(queryHash)
  if (cachedResults) {
    console.log('Using cached search results')
    return cachedResults
  }
  
  const client = createServerClient('textbook-search-fallback')
  
  try {
    console.log(`Text-based search for: "${searchQuery}" (Grade ${params.gradeLevel})`)
    
    // Create search terms for text search
    const searchTerms = createSearchTerms(params)
    const searchString = searchTerms.join(' & ')
    
    // Execute parallel text-based searches for better performance
    const [textSearchResults, metadataSearchResults, basicFilterResults] = await parallelQuery([
      // Full-text search using PostgreSQL's text search
      async () => {
        const { data, error } = await client
          .from('textbook_embeddings')
          .select('id, content, metadata, chunk_index')
          .eq('grade_level', params.gradeLevel)
          .textSearch('content', searchString, {
            type: 'websearch',
            config: 'english'
          })
          .limit(params.maxResults || 10)
        
        if (error) {
          console.warn('Text search failed:', error)
          return []
        }
        return data || []
      },
      
      // Metadata-based search
      async () => {
        const { data, error } = await client
          .from('textbook_embeddings')
          .select('id, content, metadata, chunk_index')
          .eq('grade_level', params.gradeLevel)
          .or(`metadata->file_name.ilike.%${params.query}%,metadata->subject.ilike.%${params.studyArea || 'science'}%`)
          .limit(Math.ceil((params.maxResults || 10) / 2))
        
        if (error) {
          console.warn('Metadata search failed:', error)
          return []
        }
        return data || []
      },
      
      // Basic content filtering as fallback
      async () => {
        const { data, error } = await client
          .from('textbook_embeddings')
          .select('id, content, metadata, chunk_index')
          .eq('grade_level', params.gradeLevel)
          .ilike('content', `%${params.query}%`)
          .limit(Math.ceil((params.maxResults || 10) / 3))
        
        if (error) {
          console.warn('Basic search failed:', error)
          return []
        }
        return data || []
      }
    ])
    
    // Combine and deduplicate results
    const allResults = new Map<string, any>()
    
    // Add text search results (highest priority)
    textSearchResults.forEach((result: any, index: number) => {
      if (!allResults.has(result.id)) {
        allResults.set(result.id, {
          ...result,
          similarity: Math.max(0.9 - (index * 0.1), 0.3), // Simulate similarity score
          source: 'text_search'
        })
      }
    })
    
    // Add metadata search results (medium priority)
    metadataSearchResults.forEach((result: any, index: number) => {
      if (!allResults.has(result.id)) {
        allResults.set(result.id, {
          ...result,
          similarity: Math.max(0.8 - (index * 0.1), 0.2),
          source: 'metadata_search'
        })
      }
    })
    
    // Add basic filter results (lowest priority)
    basicFilterResults.forEach((result: any, index: number) => {
      if (!allResults.has(result.id)) {
        allResults.set(result.id, {
          ...result,
          similarity: Math.max(0.7 - (index * 0.1), 0.1),
          source: 'basic_filter'
        })
      }
    })
    
    // Convert to final format and sort by similarity
    const enrichedResults = Array.from(allResults.values())
      .filter(result => result.similarity >= (params.minSimilarity || 0.1))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, params.maxResults || 10)
      .map(result => ({
        id: result.id,
        content: result.content,
        metadata: {
          chunkIndex: result.chunk_index,
          source: result.source,
          ...result.metadata
        },
        similarity: result.similarity
      }))
    
    console.log(`Found ${enrichedResults.length} relevant chunks using text search`)
    
    // Cache results
    await cacheManager.setCachedSearchResults(queryHash, enrichedResults)
    
    return enrichedResults
    
  } catch (error) {
    console.error('Text-based textbook search failed:', error)
    return []
  }
}

// Optimized content formatting (same as before)
export function formatTextbookContentForPrompt(
  relevantContent: RelevantContent[],
  maxContentLength: number = 2500
): string {
  if (relevantContent.length === 0) {
    return 'REFERENCE CONTENT: No relevant textbook content found. Generate content based on general science knowledge.\n\n'
  }
  
  // Sort by similarity (highest first)
  const sortedContent = relevantContent.sort((a, b) => b.similarity - a.similarity)
  
  let formattedContent = 'REFERENCE TEXTBOOK CONTENT (Text Search):\n\n'
  let currentLength = formattedContent.length
  let chunksIncluded = 0
  
  for (const content of sortedContent) {
    // Truncate individual chunks if they're too long
    const truncatedContent = content.content.length > 600 
      ? content.content.substring(0, 600) + '...'
      : content.content
    
    const contentSection = `[Ref ${chunksIncluded + 1} - ${(content.similarity * 100).toFixed(1)}% match]\n${truncatedContent}\n\n`
    
    if (currentLength + contentSection.length > maxContentLength) {
      break
    }
    
    formattedContent += contentSection
    currentLength += contentSection.length
    chunksIncluded++
    
    // Limit to top 4 chunks for performance
    if (chunksIncluded >= 4) break
  }
  
  formattedContent += `INSTRUCTIONS: Use the above ${chunksIncluded} textbook references as primary sources. Content found using text search optimization.\n\n`
  
  return formattedContent
}

// Batch operation for multiple searches
export async function batchSearchTextbookContent(
  searchParams: SearchParams[]
): Promise<RelevantContent[][]> {
  const promises = searchParams.map(params => searchRelevantTextbookContent(params))
  return Promise.all(promises)
}

// Simple health check for search functionality
export async function checkSearchHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'error'
  searchMethod: 'text' | 'vector' | 'basic'
  message: string
}> {
  try {
    const client = createServerClient('health-check')
    
    // Test basic query
    const { data, error } = await client
      .from('textbook_embeddings')
      .select('id')
      .limit(1)
    
    if (error) {
      return {
        status: 'error',
        searchMethod: 'basic',
        message: `Database error: ${error.message}`
      }
    }
    
    return {
      status: 'healthy',
      searchMethod: 'text',
      message: 'Text-based search optimized for Supabase Free Tier'
    }
    
  } catch (error) {
    return {
      status: 'error',
      searchMethod: 'basic',
      message: `Search system error: ${error}`
    }
  }
}

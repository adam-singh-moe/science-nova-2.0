import { createClient } from '@supabase/supabase-js';
import { generateOpenAIEmbeddings, OPENAI_EMBEDDING_MODELS, EMBEDDING_DIMENSIONS } from './openai-embeddings';
import crypto from 'crypto';

// Enhanced types for search functionality
export interface SearchParams {
  query: string;
  gradeLevel?: number;
  documentTypes?: ('textbook' | 'curriculum' | 'lesson_plan')[];
  bucketNames?: string[];
  maxResults?: number;
  minSimilarity?: number;
  includeMetadata?: boolean;
  embeddingModel?: string;
  cacheResults?: boolean;
}

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  fileName: string;
  documentType: 'textbook' | 'curriculum' | 'lesson_plan';
  gradeLevel: number;
  bucketName: string;
  chunkIndex: number;
  tokenCount?: number;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults: number;
  searchTime: number;
  embeddingModel: string;
  cached: boolean;
  stats: {
    avgSimilarity: number;
    maxSimilarity: number;
    minSimilarity: number;
    gradeLevelDistribution: Record<number, number>;
    documentTypeDistribution: Record<string, number>;
  };
}

export interface ContextualContent {
  content: string;
  source: string;
  gradeLevel: number;
  documentType: string;
  similarity: number;
  chunkIndex: number;
}

// Cache for query embeddings
const queryEmbeddingCache = new Map<string, {
  embedding: number[];
  model: string;
  timestamp: number;
}>();

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 1000;

// Generate cache key for queries
function generateCacheKey(query: string, model: string): string {
  return crypto.createHash('sha256').update(`${query}:${model}`).digest('hex');
}

// Clean up old cache entries
function cleanupCache(): void {
  if (queryEmbeddingCache.size <= MAX_CACHE_SIZE) return;
  
  const now = Date.now();
  const entries = Array.from(queryEmbeddingCache.entries());
  
  // Remove expired entries first
  entries.forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      queryEmbeddingCache.delete(key);
    }
  });
  
  // If still too large, remove oldest entries
  if (queryEmbeddingCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = entries
      .filter(([key]) => queryEmbeddingCache.has(key))
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = sortedEntries.slice(0, queryEmbeddingCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => queryEmbeddingCache.delete(key));
  }
}

// Get or generate query embedding with caching
async function getQueryEmbedding(
  query: string, 
  model: string = OPENAI_EMBEDDING_MODELS.SMALL // Use small model by default
): Promise<number[]> {
  const cacheKey = generateCacheKey(query, model);
  const now = Date.now();
  
  // Check memory cache first
  const cached = queryEmbeddingCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL && cached.model === model) {
    return cached.embedding;
  }
  
  // Check database cache
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: dbCached } = await supabase
    .from('openai_query_cache')
    .select('embedding')
    .eq('query_hash', cacheKey)
    .eq('embedding_model', model)
    .single();
  
  if (dbCached && dbCached.embedding) {
    // Update usage stats using SQL
    await supabase
      .from('openai_query_cache')
      .update({
        last_used_at: new Date().toISOString()
      })
      .eq('query_hash', cacheKey);
    
    // Increment usage count separately
    await supabase
      .rpc('increment_query_usage', { hash_value: cacheKey })
      .then(null, () => console.warn('Could not update usage count'));
    
    // Store in memory cache
    queryEmbeddingCache.set(cacheKey, {
      embedding: dbCached.embedding,
      model,
      timestamp: now
    });
    
    return dbCached.embedding;
  }
  
  // Generate new embedding
  console.log(`Generating new embedding for query: "${query.substring(0, 100)}..."`);
  const { embeddings } = await generateOpenAIEmbeddings([query], model);
  let embedding = embeddings[0];
  
  // Ensure embedding fits pgvector dimensions (truncate if needed)
  if (embedding.length > 1536) {
    console.log(`Truncating query embedding from ${embedding.length} to 1536 dimensions`);
    embedding = embedding.slice(0, 1536);
  }
  
  // Store in database cache
  await supabase
    .from('openai_query_cache')
    .upsert({
      query_hash: cacheKey,
      query_text: query,
      embedding,
      embedding_model: model,
      usage_count: 1,
      last_used_at: new Date().toISOString()
    }, {
      onConflict: 'query_hash'
    });
  
  // Store in memory cache
  queryEmbeddingCache.set(cacheKey, {
    embedding,
    model,
    timestamp: now
  });
  
  // Cleanup cache if needed
  cleanupCache();
  
  return embedding;
}

// Pad embedding to target dimensions if needed
function padEmbedding(embedding: number[], targetDimensions: number): number[] {
  if (embedding.length === targetDimensions) {
    return embedding;
  }
  
  if (embedding.length > targetDimensions) {
    console.warn(`Embedding has ${embedding.length} dimensions, truncating to ${targetDimensions}`);
    return embedding.slice(0, targetDimensions);
  }
  
  // Pad with zeros
  const padded = new Array(targetDimensions).fill(0);
  for (let i = 0; i < embedding.length; i++) {
    padded[i] = embedding[i];
  }
  
  return padded;
}

// Main search function
export async function searchEmbeddings(params: SearchParams): Promise<SearchResponse> {
  const startTime = Date.now();
  const model = params.embeddingModel || OPENAI_EMBEDDING_MODELS.LARGE;
  
  try {
    console.log(`Searching embeddings with query: "${params.query.substring(0, 100)}..."`);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Generate query embedding
    const queryEmbedding = await getQueryEmbedding(params.query, model);
    
    // Determine which search function to use based on embedding dimensions
    const embeddingDimensions = queryEmbedding.length;
    const targetDimensions = 3072; // Our database stores 3072-dimensional embeddings
    
    let searchFunction: string;
    let searchEmbedding: number[];
    
    if (embeddingDimensions === 1536) {
      // Use the small model search function
      searchFunction = 'search_openai_embeddings_small';
      searchEmbedding = queryEmbedding;
    } else {
      // Use the large model search function
      searchFunction = 'search_openai_embeddings';
      searchEmbedding = padEmbedding(queryEmbedding, targetDimensions);
    }
    
    // Prepare search parameters
    const searchParams = {
      query_embedding: searchEmbedding,
      grade_filter: params.gradeLevel || null,
      document_types: params.documentTypes || null,
      match_threshold: params.minSimilarity || 0.7,
      match_count: params.maxResults || 15
    };
    
    // Execute search
    const { data: results, error } = await supabase.rpc(searchFunction, searchParams);
    
    if (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
    
    if (!results || results.length === 0) {
      return {
        results: [],
        query: params.query,
        totalResults: 0,
        searchTime: Date.now() - startTime,
        embeddingModel: model,
        cached: false,
        stats: {
          avgSimilarity: 0,
          maxSimilarity: 0,
          minSimilarity: 0,
          gradeLevelDistribution: {},
          documentTypeDistribution: {}
        }
      };
    }
    
    // Process and format results
    const searchResults: SearchResult[] = results.map((result: any) => ({
      id: result.id,
      content: result.content,
      similarity: result.similarity,
      fileName: result.file_name,
      documentType: result.document_type,
      gradeLevel: result.grade_level,
      bucketName: result.metadata?.bucketName || 'unknown',
      chunkIndex: result.metadata?.chunkIndex || 0,
      tokenCount: result.token_count,
      metadata: params.includeMetadata ? result.metadata : undefined
    }));
    
    // Calculate statistics
    const similarities = searchResults.map(r => r.similarity);
    const avgSimilarity = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    const maxSimilarity = Math.max(...similarities);
    const minSimilarity = Math.min(...similarities);
    
    const gradeLevelDistribution = searchResults.reduce((dist, result) => {
      dist[result.gradeLevel] = (dist[result.gradeLevel] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);
    
    const documentTypeDistribution = searchResults.reduce((dist, result) => {
      dist[result.documentType] = (dist[result.documentType] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    const searchTime = Date.now() - startTime;
    
    console.log(`Search completed: ${searchResults.length} results in ${searchTime}ms`);
    
    return {
      results: searchResults,
      query: params.query,
      totalResults: searchResults.length,
      searchTime,
      embeddingModel: model,
      cached: false, // TODO: Implement result caching
      stats: {
        avgSimilarity,
        maxSimilarity,
        minSimilarity,
        gradeLevelDistribution,
        documentTypeDistribution
      }
    };
    
  } catch (error) {
    console.error('Error in searchEmbeddings:', error);
    throw error;
  }
}

// Enhanced search with contextual query expansion
export async function searchWithContext(
  query: string,
  context: {
    gradeLevel: number;
    subject?: string;
    topicKeywords?: string[];
    learningObjectives?: string[];
  },
  options: Omit<SearchParams, 'query' | 'gradeLevel'> = {}
): Promise<SearchResponse> {
  // Expand the query with contextual information
  let expandedQuery = query;
  
  if (context.subject) {
    expandedQuery += ` ${context.subject}`;
  }
  
  if (context.topicKeywords && context.topicKeywords.length > 0) {
    expandedQuery += ` ${context.topicKeywords.join(' ')}`;
  }
  
  if (context.learningObjectives && context.learningObjectives.length > 0) {
    expandedQuery += ` ${context.learningObjectives.join(' ')}`;
  }
  
  // Add grade-level appropriate vocabulary
  const gradeContext = getGradeLevelContext(context.gradeLevel);
  expandedQuery += ` ${gradeContext}`;
  
  return searchEmbeddings({
    query: expandedQuery,
    gradeLevel: context.gradeLevel,
    ...options
  });
}

// Get grade-level appropriate context words
function getGradeLevelContext(gradeLevel: number): string {
  const contextMap: Record<number, string> = {
    1: 'elementary basic simple introduction beginner',
    2: 'elementary primary foundation basic',
    3: 'elementary intermediate concepts understanding',
    4: 'intermediate concepts learning exploration',
    5: 'intermediate advanced concepts analysis',
    6: 'advanced concepts critical thinking analysis',
    7: 'middle school concepts reasoning',
    8: 'middle school advanced reasoning analysis',
    9: 'high school concepts complex analysis',
    10: 'high school advanced complex reasoning',
    11: 'advanced high school college prep',
    12: 'advanced college prep university level'
  };
  
  return contextMap[gradeLevel] || contextMap[6];
}

// Search for relevant content for AI prompt generation
export async function searchForPromptContext(
  topic: string,
  gradeLevel: number,
  contentType: 'lesson' | 'quiz' | 'discovery' | 'arcade' = 'lesson',
  maxChars: number = 4000
): Promise<string> {
  const contentTypeKeywords = {
    lesson: 'lesson content explanation teaching',
    quiz: 'questions assessment evaluation test',
    discovery: 'facts interesting discovery exploration',
    arcade: 'interactive game activity fun'
  };
  
  const searchQuery = `${topic} ${contentTypeKeywords[contentType]}`;
  
  const response = await searchEmbeddings({
    query: searchQuery,
    gradeLevel,
    maxResults: 10,
    minSimilarity: 0.6,
    includeMetadata: false
  });
  
  if (response.results.length === 0) {
    return '';
  }
  
  // Format results for prompt inclusion
  let contextText = '';
  let currentLength = 0;
  
  // Sort by similarity and relevance
  const sortedResults = response.results.sort((a, b) => b.similarity - a.similarity);
  
  for (const result of sortedResults) {
    const addition = `[${result.documentType.toUpperCase()}: ${result.fileName}]\n${result.content}\n\n`;
    
    if (currentLength + addition.length > maxChars) {
      break;
    }
    
    contextText += addition;
    currentLength += addition.length;
  }
  
  return contextText;
}

// Batch search for multiple queries
export async function batchSearch(
  queries: string[],
  sharedParams: Omit<SearchParams, 'query'> = {}
): Promise<SearchResponse[]> {
  const results: SearchResponse[] = [];
  
  // Process in batches to avoid overwhelming the system
  const batchSize = 5;
  
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    
    const batchPromises = batch.map(query => 
      searchEmbeddings({ query, ...sharedParams })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < queries.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Get similar content based on existing content
export async function findSimilarContent(
  contentId: string,
  maxResults: number = 10,
  excludeSameFile: boolean = true
): Promise<SearchResult[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get the content and its embedding
  const { data: sourceContent, error: fetchError } = await supabase
    .from('openai_embeddings')
    .select('content, embedding, file_name, grade_level, document_type')
    .eq('id', contentId)
    .single();
  
  if (fetchError || !sourceContent) {
    throw new Error(`Could not find content with ID: ${contentId}`);
  }
  
  // Search for similar content using the source embedding
  const searchParams = {
    query_embedding: sourceContent.embedding,
    grade_filter: sourceContent.grade_level,
    document_types: null,
    match_threshold: 0.7,
    match_count: maxResults + (excludeSameFile ? 5 : 0) // Get extra to filter out same file
  };
  
  const { data: results, error: searchError } = await supabase.rpc(
    'search_openai_embeddings', 
    searchParams
  );
  
  if (searchError) {
    throw new Error(`Similar content search failed: ${searchError.message}`);
  }
  
  if (!results) {
    return [];
  }
  
  // Filter and format results
  let filteredResults = results;
  
  if (excludeSameFile) {
    filteredResults = results.filter((result: any) => 
      result.file_name !== sourceContent.file_name
    );
  }
  
  return filteredResults
    .slice(0, maxResults)
    .map((result: any) => ({
      id: result.id,
      content: result.content,
      similarity: result.similarity,
      fileName: result.file_name,
      documentType: result.document_type,
      gradeLevel: result.grade_level,
      bucketName: result.metadata?.bucketName || 'unknown',
      chunkIndex: result.metadata?.chunkIndex || 0,
      tokenCount: result.token_count
    }));
}

// Get embedding statistics and health metrics
export async function getSearchStats(): Promise<{
  totalEmbeddings: number;
  embeddingsByGrade: Record<number, number>;
  embeddingsByType: Record<string, number>;
  queryCache: {
    size: number;
    hitRate: number;
    oldestEntry: number;
  };
  avgSearchTime: number;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get embedding statistics
  const { data: stats } = await supabase.rpc('get_openai_embeddings_stats');
  
  const embeddingStats = stats?.[0] || {};
  
  return {
    totalEmbeddings: embeddingStats.total_chunks || 0,
    embeddingsByGrade: embeddingStats.chunks_by_grade || {},
    embeddingsByType: embeddingStats.chunks_by_type || {},
    queryCache: {
      size: queryEmbeddingCache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
      oldestEntry: Math.min(...Array.from(queryEmbeddingCache.values()).map(v => v.timestamp))
    },
    avgSearchTime: 0 // TODO: Implement search time tracking
  };
}

export default {
  searchEmbeddings,
  searchWithContext,
  searchForPromptContext,
  batchSearch,
  findSimilarContent,
  getSearchStats,
  cleanupCache
};
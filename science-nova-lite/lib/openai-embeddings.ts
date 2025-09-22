import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Types for our enhanced embeddings system
export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  metadata: {
    totalChunks: number;
    chunkSize: number;
    gradeLevel: number;
    fileName: string;
    documentType: 'textbook' | 'curriculum' | 'lesson_plan';
    bucketName: string;
    filePath: string;
    extractionMethod?: string;
    processedAt: string;
    pageNumber?: number;
    section?: string;
  };
}

export interface EmbeddingResult {
  success: boolean;
  chunksProcessed: number;
  totalTokens: number;
  error?: string;
  extractionMethod?: string;
  embeddingModel: string;
}

export interface ProcessingStatus {
  filePath: string;
  fileName: string;
  bucketName: string;
  gradeLevel?: number;
  documentType: 'textbook' | 'curriculum' | 'lesson_plan';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  chunksCreated: number;
  totalTokens: number;
  embeddingModel?: string;
  errorMessage?: string;
  retryCount: number;
}

// OpenAI embeddings configuration
export const OPENAI_EMBEDDING_MODELS = {
  LARGE: 'text-embedding-3-large',    // 3072 dimensions, will be truncated to 1536
  SMALL: 'text-embedding-3-small',    // 1536 dimensions, optimal for pgvector
} as const;

export const EMBEDDING_DIMENSIONS = {
  [OPENAI_EMBEDDING_MODELS.LARGE]: 3072,
  [OPENAI_EMBEDDING_MODELS.SMALL]: 1536,
} as const;

// Configuration optimized for pgvector compatibility
export const EMBEDDING_CONFIG = {
  DEFAULT_MODEL: OPENAI_EMBEDDING_MODELS.SMALL, // Use small model by default
  STORE_DIMENSIONS: 1536,     // Store 1536 dims to stay within pgvector limits
  TRUNCATE_LARGE_MODEL: true, // Truncate 3072-dim embeddings to 1536
  CHUNK_SIZE: 1000,           // Tokens per chunk
  CHUNK_OVERLAP: 100,         // Overlap between chunks
  MAX_TOKENS_PER_REQUEST: 8000, // OpenAI API limit
  BATCH_SIZE: 100,            // Number of chunks to process per batch
  MAX_CHUNK_SIZE: 8000,       // Characters per chunk (approx 2000 tokens)
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000           // ms
} as const;

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Function to estimate token count (rough approximation)
function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Enhanced text chunking with better overlap handling
export function chunkText(
  text: string, 
  maxChunkSize: number = EMBEDDING_CONFIG.MAX_CHUNK_SIZE,
  overlap: number = EMBEDDING_CONFIG.CHUNK_OVERLAP
): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let i = 0;

  while (i < sentences.length) {
    const sentence = sentences[i].trim();
    
    // If adding this sentence would exceed the limit
    if (currentChunk.length + sentence.length + 1 > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Create overlap by including the last few sentences from previous chunk
        const overlapSentences = currentChunk.split(/[.!?]+/).slice(-2);
        currentChunk = overlapSentences.join('. ').trim();
        if (currentChunk.length > 0) {
          currentChunk += '. ';
        }
      }
    }
    
    currentChunk += sentence + '. ';
    i++;
  }

  // Add the final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Filter out chunks that are too small to be meaningful
  return chunks.filter(chunk => chunk.length >= 50);
}

// Function to truncate large embeddings to fit pgvector limits
function truncateEmbedding(embedding: number[], targetDimensions: number = EMBEDDING_CONFIG.STORE_DIMENSIONS): number[] {
  if (embedding.length <= targetDimensions) {
    return embedding;
  }
  
  console.log(`Truncating embedding from ${embedding.length} to ${targetDimensions} dimensions`);
  return embedding.slice(0, targetDimensions);
}

// Generate embeddings using OpenAI's latest models with automatic truncation
export async function generateOpenAIEmbeddings(
  texts: string[],
  model: string = EMBEDDING_CONFIG.DEFAULT_MODEL
): Promise<{
  embeddings: number[][];
  totalTokens: number;
  model: string;
}> {
  const client = getOpenAIClient();
  const allEmbeddings: number[][] = [];
  let totalTokens = 0;

  console.log(`Generating embeddings for ${texts.length} text chunks using ${model}...`);

  // Process in batches
  const batchSize = EMBEDDING_CONFIG.BATCH_SIZE;
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} with ${batch.length} items`);
    
    let retries = 0;
    let success = false;
    
    while (retries < EMBEDDING_CONFIG.MAX_RETRIES && !success) {
      try {
        const response = await client.embeddings.create({
          model,
          input: batch,
          encoding_format: 'float',
        });

        // Extract embeddings and apply truncation if needed
        const batchEmbeddings = response.data.map(item => {
          const embedding = item.embedding;
          
          // Truncate if using the large model or if dimensions exceed pgvector limits
          if (model === OPENAI_EMBEDDING_MODELS.LARGE || embedding.length > EMBEDDING_CONFIG.STORE_DIMENSIONS) {
            return truncateEmbedding(embedding);
          }
          
          return embedding;
        });
        
        allEmbeddings.push(...batchEmbeddings);
        totalTokens += response.usage.total_tokens;
        
        success = true;
        
        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        retries++;
        console.error(`Error generating embeddings (attempt ${retries}/${EMBEDDING_CONFIG.MAX_RETRIES}):`, error);
        
        if (retries < EMBEDDING_CONFIG.MAX_RETRIES) {
          // Exponential backoff
          const delay = EMBEDDING_CONFIG.RETRY_DELAY * Math.pow(2, retries - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error(`Failed to generate embeddings after ${EMBEDDING_CONFIG.MAX_RETRIES} retries: ${error}`);
        }
      }
    }
  }

  console.log(`Generated ${allEmbeddings.length} embeddings with ${totalTokens} total tokens`);
  
  // Validate dimensions
  const expectedDimensions = EMBEDDING_DIMENSIONS[model as keyof typeof EMBEDDING_DIMENSIONS];
  if (allEmbeddings.length > 0 && allEmbeddings[0].length !== expectedDimensions) {
    console.warn(`Warning: Expected ${expectedDimensions} dimensions but got ${allEmbeddings[0].length}`);
  }

  return {
    embeddings: allEmbeddings,
    totalTokens,
    model
  };
}

// Store embeddings in the database
export async function storeEmbeddings(
  chunks: DocumentChunk[],
  embeddings: number[][],
  model: string,
  supabase: any
): Promise<{ success: boolean; storedCount: number; error?: string }> {
  if (chunks.length !== embeddings.length) {
    return {
      success: false,
      storedCount: 0,
      error: `Mismatch between chunks (${chunks.length}) and embeddings (${embeddings.length})`
    };
  }

  try {
    // Prepare data for insertion
    const embeddingData = chunks.map((chunk, index) => ({
      grade_level: chunk.metadata.gradeLevel,
      document_type: chunk.metadata.documentType,
      file_name: chunk.metadata.fileName,
      file_path: chunk.metadata.filePath,
      bucket_name: chunk.metadata.bucketName,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: embeddings[index],
      embedding_model: model,
      token_count: estimateTokenCount(chunk.content),
    }));

    // Delete existing embeddings for this file to avoid duplicates
    const { error: deleteError } = await supabase
      .from('openai_embeddings')
      .delete()
      .eq('file_path', chunks[0].metadata.filePath);

    if (deleteError) {
      console.warn('Warning: Could not delete existing embeddings:', deleteError);
    }

    // Insert new embeddings in batches
    const batchSize = 100;
    let totalStored = 0;

    for (let i = 0; i < embeddingData.length; i += batchSize) {
      const batch = embeddingData.slice(i, i + batchSize);
      
      const { error: insertError, data } = await supabase
        .from('openai_embeddings')
        .insert(batch)
        .select('id');

      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError);
        return {
          success: false,
          storedCount: totalStored,
          error: `Failed to insert embeddings: ${insertError.message}`
        };
      }

      totalStored += batch.length;
      console.log(`Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(embeddingData.length / batchSize)} (${batch.length} embeddings)`);
    }

    return {
      success: true,
      storedCount: totalStored
    };

  } catch (error) {
    console.error('Error storing embeddings:', error);
    return {
      success: false,
      storedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process a single document and generate embeddings
export async function processDocumentForEmbeddings(
  filePath: string,
  fileName: string,
  bucketName: string,
  gradeLevel: number,
  documentType: 'textbook' | 'curriculum' | 'lesson_plan',
  textContent: string,
  extractionMethod: string,
  model: string = EMBEDDING_CONFIG.DEFAULT_MODEL
): Promise<EmbeddingResult> {
  try {
    console.log(`Processing ${fileName} for embeddings...`);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update processing status
    await updateProcessingStatus(supabase, filePath, 'processing', {
      embeddingModel: model
    });

    // Chunk the text
    const textChunks = chunkText(textContent);
    
    if (textChunks.length === 0) {
      await updateProcessingStatus(supabase, filePath, 'failed', {
        errorMessage: 'No valid text chunks could be created'
      });
      
      return {
        success: false,
        chunksProcessed: 0,
        totalTokens: 0,
        error: 'No valid text chunks could be created',
        extractionMethod,
        embeddingModel: model
      };
    }

    console.log(`Created ${textChunks.length} text chunks`);

    // Generate embeddings
    const { embeddings, totalTokens } = await generateOpenAIEmbeddings(textChunks, model);

    // Create document chunks with metadata
    const documentChunks: DocumentChunk[] = textChunks.map((chunk, index) => ({
      content: chunk,
      chunkIndex: index,
      metadata: {
        totalChunks: textChunks.length,
        chunkSize: chunk.length,
        gradeLevel,
        fileName,
        documentType,
        bucketName,
        filePath,
        extractionMethod,
        processedAt: new Date().toISOString()
      }
    }));

    // Store embeddings in database
    const { success, storedCount, error } = await storeEmbeddings(
      documentChunks,
      embeddings,
      model,
      supabase
    );

    if (success) {
      await updateProcessingStatus(supabase, filePath, 'completed', {
        chunksCreated: storedCount,
        totalTokens,
        embeddingModel: model
      });

      console.log(`Successfully processed ${fileName}: ${storedCount} chunks, ${totalTokens} tokens`);
      
      return {
        success: true,
        chunksProcessed: storedCount,
        totalTokens,
        extractionMethod,
        embeddingModel: model
      };
    } else {
      await updateProcessingStatus(supabase, filePath, 'failed', {
        errorMessage: error
      });

      return {
        success: false,
        chunksProcessed: 0,
        totalTokens,
        error,
        extractionMethod,
        embeddingModel: model
      };
    }

  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await updateProcessingStatus(supabase, filePath, 'failed', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      chunksProcessed: 0,
      totalTokens: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      extractionMethod,
      embeddingModel: model
    };
  }
}

// Update processing status in database
async function updateProcessingStatus(
  supabase: any,
  filePath: string,
  status: ProcessingStatus['status'],
  updates: Partial<{
    chunksCreated: number;
    totalTokens: number;
    embeddingModel: string;
    errorMessage: string;
  }> = {}
): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_document_processing_status', {
      p_file_path: filePath,
      p_status: status,
      p_chunks_created: updates.chunksCreated || null,
      p_total_tokens: updates.totalTokens || null,
      p_error_message: updates.errorMessage || null
    });

    if (error) {
      console.warn('Warning: Could not update processing status:', error);
    }
  } catch (error) {
    console.warn('Warning: Error updating processing status:', error);
  }
}

// Function to get processing statistics
export async function getProcessingStats(): Promise<{
  totalDocuments: number;
  documentsProcessed: number;
  documentsFailed: number;
  documentsProcessing: number;
  totalChunks: number;
  totalTokens: number;
  embeddingModels: Record<string, number>;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get processing status stats
    const { data: statusStats } = await supabase
      .from('document_processing_status')
      .select('status, chunks_created, total_tokens');

    // Get embedding stats
    const { data: embeddingStats } = await supabase
      .rpc('get_openai_embeddings_stats');

    const stats = {
      totalDocuments: statusStats?.length || 0,
      documentsProcessed: statusStats?.filter(s => s.status === 'completed').length || 0,
      documentsFailed: statusStats?.filter(s => s.status === 'failed').length || 0,
      documentsProcessing: statusStats?.filter(s => s.status === 'processing').length || 0,
      totalChunks: embeddingStats?.[0]?.total_chunks || 0,
      totalTokens: statusStats?.reduce((sum, s) => sum + (s.total_tokens || 0), 0) || 0,
      embeddingModels: embeddingStats?.[0]?.model_distribution || {}
    };

    return stats;
  } catch (error) {
    console.error('Error getting processing stats:', error);
    return {
      totalDocuments: 0,
      documentsProcessed: 0,
      documentsFailed: 0,
      documentsProcessing: 0,
      totalChunks: 0,
      totalTokens: 0,
      embeddingModels: {}
    };
  }
}

// Function to reprocess failed documents
export async function reprocessFailedDocuments(): Promise<{
  success: boolean;
  reprocessedCount: number;
  errors: string[];
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get failed documents that haven't exceeded retry limit
    const { data: failedDocs, error } = await supabase
      .from('document_processing_status')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', EMBEDDING_CONFIG.MAX_RETRIES);

    if (error) {
      throw error;
    }

    if (!failedDocs || failedDocs.length === 0) {
      return {
        success: true,
        reprocessedCount: 0,
        errors: []
      };
    }

    console.log(`Found ${failedDocs.length} failed documents to reprocess`);

    const errors: string[] = [];
    let reprocessedCount = 0;

    for (const doc of failedDocs) {
      try {
        // Update retry count and status
        await supabase
          .from('document_processing_status')
          .update({
            status: 'retry',
            retry_count: doc.retry_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', doc.id);

        console.log(`Marked ${doc.file_name} for retry (attempt ${doc.retry_count + 1})`);
        reprocessedCount++;
        
      } catch (error) {
        const errorMsg = `Failed to mark ${doc.file_name} for retry: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      reprocessedCount,
      errors
    };

  } catch (error) {
    console.error('Error reprocessing failed documents:', error);
    return {
      success: false,
      reprocessedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// Function to clean up old cache entries
export async function cleanupEmbeddingCache(): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data } = await supabase.rpc('cleanup_openai_query_cache');
    return data || 0;
  } catch (error) {
    console.error('Error cleaning up cache:', error);
    return 0;
  }
}

export default {
  generateOpenAIEmbeddings,
  processDocumentForEmbeddings,
  chunkText,
  storeEmbeddings,
  getProcessingStats,
  reprocessFailedDocuments,
  cleanupEmbeddingCache,
  OPENAI_EMBEDDING_MODELS,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_CONFIG,
};
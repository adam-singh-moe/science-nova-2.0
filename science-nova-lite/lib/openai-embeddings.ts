import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

/**
 * Generate an embedding vector for the given text using OpenAI's embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.replace(/\n/g, ' ').trim()
    })

    if (!response.data?.[0]?.embedding) {
      throw new Error('No embedding returned from OpenAI')
    }

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error(`Failed to generate embedding: ${error}`)
  }
}

/**
 * Generate multiple embeddings for an array of texts
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    // Process in smaller batches to avoid rate limits
    const batchSize = 10
    const embeddings: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: batch.map(text => text.replace(/\n/g, ' ').trim())
      })

      if (!response.data || response.data.length !== batch.length) {
        throw new Error('Incomplete batch embedding response from OpenAI')
      }

      const batchEmbeddings = response.data.map(item => item.embedding)
      embeddings.push(...batchEmbeddings)

      // Small delay to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return embeddings
  } catch (error) {
    console.error('Error generating batch embeddings:', error)
    throw new Error(`Failed to generate batch embeddings: ${error}`)
  }
}

/**
 * Chunk text into smaller pieces suitable for embedding
 */
export function chunkText(text: string, maxChunkSize: number = 1000, overlapSize: number = 100): string[] {
  // Clean and normalize the text
  const cleanText = text.replace(/\s+/g, ' ').trim()
  
  if (cleanText.length <= maxChunkSize) {
    return [cleanText]
  }

  const chunks: string[] = []
  let start = 0

  while (start < cleanText.length) {
    let end = start + maxChunkSize
    
    // Try to break at sentence boundaries
    if (end < cleanText.length) {
      const sentenceEnd = cleanText.lastIndexOf('. ', end)
      const questionEnd = cleanText.lastIndexOf('? ', end)
      const exclamationEnd = cleanText.lastIndexOf('! ', end)
      
      const bestEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd)
      if (bestEnd > start + maxChunkSize * 0.5) {
        end = bestEnd + 2 // Include the punctuation and space
      }
    }

    chunks.push(cleanText.slice(start, end).trim())
    
    // Move start position with overlap
    start = end - overlapSize
    if (start >= cleanText.length) break
  }

  return chunks.filter(chunk => chunk.length > 0)
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}

/**
 * Extract key information from content for better embeddings
 */
export function extractKeyContent(content: string, metadata?: any): string {
  // Start with the main content
  let keyContent = content

  // Add important metadata context
  if (metadata) {
    const contextParts: string[] = []
    
    if (metadata.title) {
      contextParts.push(`Title: ${metadata.title}`)
    }
    if (metadata.subject) {
      contextParts.push(`Subject: ${metadata.subject}`)
    }
    if (metadata.topic) {
      contextParts.push(`Topic: ${metadata.topic}`)
    }
    if (metadata.grade_level) {
      contextParts.push(`Grade Level: ${metadata.grade_level}`)
    }

    if (contextParts.length > 0) {
      keyContent = contextParts.join('. ') + '. ' + keyContent
    }
  }

  return keyContent
}

export type EmbeddingSearchResult = {
  id: string
  content: string
  metadata: any
  similarity: number
}

export type EmbeddingChunk = {
  content: string
  metadata: any
  chunkIndex: number
}

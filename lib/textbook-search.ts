import { generateEmbeddings } from './textbook-processor'
import { createServerClient } from './supabase-server'

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

// Main function to search for relevant textbook content
export async function searchRelevantTextbookContent(
  params: SearchParams
): Promise<RelevantContent[]> {
  try {
    const supabase = createServerClient()
    
    // Create comprehensive search query
    const searchQuery = createSearchQuery(params)
    console.log(`Searching textbook content for: "${searchQuery}"`)
    
    // Generate embedding for the search query
    const queryEmbeddings = await generateEmbeddings([searchQuery])
    const queryEmbedding = queryEmbeddings[0]
    
    // Search for similar content using the database function
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

// Function to format textbook content for AI prompt inclusion
export function formatTextbookContentForPrompt(
  relevantContent: RelevantContent[],
  maxContentLength: number = 4000
): string {
  if (relevantContent.length === 0) {
    return ''
  }
  
  // Sort by similarity (highest first)
  const sortedContent = relevantContent.sort((a, b) => b.similarity - a.similarity)
  
  let formattedContent = 'REFERENCE TEXTBOOK CONTENT:\n\n'
  let currentLength = formattedContent.length
  
  for (const content of sortedContent) {
    const contentSection = `[Textbook Reference - Similarity: ${(content.similarity * 100).toFixed(1)}%]\n${content.content}\n\n`
    
    if (currentLength + contentSection.length > maxContentLength) {
      break
    }
    
    formattedContent += contentSection
    currentLength += contentSection.length
  }
  
  formattedContent += 'INSTRUCTIONS: Use the above textbook content as your primary reference. Ensure your generated content is aligned with and builds upon these textbook materials. Maintain accuracy while adapting the complexity to the student\'s learning preference.\n\n'
  
  return formattedContent
}

// Function to get textbook content statistics
export async function getTextbookContentStats(): Promise<{
  totalChunks: number
  chunksByGrade: Record<number, number>
  lastProcessed: Record<number, string>
}> {
  try {
    const supabase = createServerClient()
    
    // Get total chunks count
    const { count: totalChunks, error: countError } = await supabase
      .from('textbook_embeddings')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      throw countError
    }
    
    // Get chunks by grade
    const { data: gradeStats, error: gradeError } = await supabase
      .from('textbook_embeddings')
      .select('grade_level, created_at')
      .order('created_at', { ascending: false })
    
    if (gradeError) {
      throw gradeError
    }
    
    const chunksByGrade: Record<number, number> = {}
    const lastProcessed: Record<number, string> = {}
    
    for (const stat of gradeStats || []) {
      const grade = stat.grade_level
      chunksByGrade[grade] = (chunksByGrade[grade] || 0) + 1
      
      if (!lastProcessed[grade]) {
        lastProcessed[grade] = stat.created_at
      }
    }
    
    return {
      totalChunks: totalChunks || 0,
      chunksByGrade,
      lastProcessed
    }
    
  } catch (error) {
    console.error('Error getting textbook content stats:', error)
    return {
      totalChunks: 0,
      chunksByGrade: {},
      lastProcessed: {}
    }
  }
}

// Function to validate if textbook content exists for a grade
export async function hasTextbookContentForGrade(gradeLevel: number): Promise<boolean> {
  try {
    const supabase = createServerClient()
    
    const { count, error } = await supabase
      .from('textbook_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('grade_level', gradeLevel)
    
    if (error) {
      console.error(`Error checking textbook content for grade ${gradeLevel}:`, error)
      return false
    }
    
    return (count || 0) > 0
  } catch (error) {
    console.error(`Error checking textbook content for grade ${gradeLevel}:`, error)
    return false
  }
}

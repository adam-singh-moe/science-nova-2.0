import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateEmbedding, type EmbeddingSearchResult } from '@/lib/openai-embeddings'

export async function POST(request: NextRequest) {
  try {
    const { query, gradeLevel, threshold = 0.7, limit = 10 } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query)

    // Call the PostgreSQL function to search similar content
    const { data, error } = await supabase.rpc('search_similar_textbook_content', {
      query_embedding: queryEmbedding,
      grade_filter: gradeLevel,
      match_threshold: threshold,
      match_count: limit
    })

    if (error) {
      console.error('Database error during similarity search:', error)
      return NextResponse.json(
        { error: 'Failed to search content' },
        { status: 500 }
      )
    }

    const results: EmbeddingSearchResult[] = (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      metadata: item.metadata,
      similarity: item.similarity
    }))

    return NextResponse.json({
      results,
      query,
      gradeLevel,
      threshold,
      count: results.length
    })

  } catch (error) {
    console.error('Error in embeddings search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const gradeLevel = searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined
    const threshold = searchParams.get('threshold') ? parseFloat(searchParams.get('threshold')!) : 0.7
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query)

    // Call the PostgreSQL function to search similar content
    const { data, error } = await supabase.rpc('search_similar_textbook_content', {
      query_embedding: queryEmbedding,
      grade_filter: gradeLevel,
      match_threshold: threshold,
      match_count: limit
    })

    if (error) {
      console.error('Database error during similarity search:', error)
      return NextResponse.json(
        { error: 'Failed to search content' },
        { status: 500 }
      )
    }

    const results: EmbeddingSearchResult[] = (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      metadata: item.metadata,
      similarity: item.similarity
    }))

    return NextResponse.json({
      results,
      query,
      gradeLevel,
      threshold,
      count: results.length
    })

  } catch (error) {
    console.error('Error in embeddings search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Endpoint for uploading and processing content for embeddings
export async function PUT(request: NextRequest) {
  try {
    const { 
      content, 
      gradeLevel, 
      fileName, 
      metadata = {},
      overwrite = false 
    } = await request.json()

    if (!content || !gradeLevel || !fileName) {
      return NextResponse.json(
        { error: 'Content, gradeLevel, and fileName are required' },
        { status: 400 }
      )
    }

    // Import chunking function here to avoid circular dependency
    const { chunkText, generateBatchEmbeddings } = await import('@/lib/openai-embeddings')

    // Split content into chunks
    const chunks = chunkText(content)
    
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No valid content chunks generated' },
        { status: 400 }
      )
    }

    // Generate embeddings for all chunks
    const embeddings = await generateBatchEmbeddings(chunks)

    // If overwrite is true, delete existing entries for this file
    if (overwrite) {
      await supabase
        .from('textbook_embeddings')
        .delete()
        .eq('grade_level', gradeLevel)
        .eq('file_name', fileName)
    }

    // Prepare data for insertion
    const embeddingData = chunks.map((chunk, index) => ({
      grade_level: gradeLevel,
      file_name: fileName,
      chunk_index: index,
      content: chunk,
      metadata: {
        ...metadata,
        chunk_length: chunk.length,
        total_chunks: chunks.length
      },
      embedding: embeddings[index]
    }))

    // Insert embeddings into database
    const { data, error } = await supabase
      .from('textbook_embeddings')
      .upsert(embeddingData, {
        onConflict: 'grade_level,file_name,chunk_index'
      })
      .select('id')

    if (error) {
      console.error('Database error during embedding storage:', error)
      return NextResponse.json(
        { error: 'Failed to store embeddings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Embeddings created successfully',
      fileName,
      gradeLevel,
      chunksProcessed: chunks.length,
      embeddingsStored: data?.length || 0
    })

  } catch (error) {
    console.error('Error creating embeddings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

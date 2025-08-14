import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { topicIds, userId = 'default-user' } = await request.json()

    if (!topicIds || !Array.isArray(topicIds)) {
      return NextResponse.json({ error: 'Topic IDs array is required' }, { status: 400 })
    }

    console.log(`🚀 Pre-caching content for ${topicIds.length} topics...`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const topicId of topicIds) {
      try {
        console.log(`📝 Generating content for topic: ${topicId}`)

        // Check if content is already cached
        const { data: existingCache } = await supabase
          .from('content_cache')
          .select('id')
          .eq('topic_id', topicId)
          .eq('user_id', userId)
          .single()

        if (existingCache) {
          console.log(`💾 Content already cached for topic: ${topicId}`)
          results.push({ topicId, status: 'already_cached' })
          continue
        }

        // Generate content by calling the existing API
        const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-enhanced-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topicId }),
        })

        if (contentResponse.ok) {
          const contentData = await contentResponse.json()
          console.log(`✅ Successfully cached content for topic: ${topicId}`)
          results.push({ 
            topicId, 
            status: 'success',
            hasImages: contentData.flashcards?.some((f: any) => f.coverImage) || false
          })
          successCount++
        } else {
          console.error(`❌ Failed to generate content for topic: ${topicId}`)
          results.push({ topicId, status: 'error', error: 'Generation failed' })
          errorCount++
        }

        // Add delay between requests to avoid rate limiting
        if (topicIds.indexOf(topicId) < topicIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error) {
        console.error(`❌ Error caching topic ${topicId}:`, error)
        results.push({ 
          topicId, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        errorCount++
      }
    }

    console.log(`📊 Pre-caching complete: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: topicIds.length,
        successful: successCount,
        errors: errorCount,
        alreadyCached: results.filter(r => r.status === 'already_cached').length
      }
    })

  } catch (error) {
    console.error('Error in pre-cache API:', error)
    return NextResponse.json(
      { error: 'Failed to pre-cache topics' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const clearAll = url.searchParams.get('clearAll') === 'true'
    const olderThan = url.searchParams.get('olderThan') // Date string

    console.log(`🗑️ Clearing cache... clearAll: ${clearAll}, olderThan: ${olderThan}`)

    let query = supabase.from('content_cache').delete()

    if (!clearAll && olderThan) {
      query = query.lt('created_at', olderThan)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error clearing cache:', error)
      return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
    }

    console.log(`✅ Cache cleared successfully`)

    return NextResponse.json({
      success: true,
      message: clearAll ? 'All cache cleared' : `Cache older than ${olderThan} cleared`
    })

  } catch (error) {
    console.error('Error in cache clear API:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

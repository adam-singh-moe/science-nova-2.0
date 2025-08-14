import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Starting daily cache cleanup...')

    // Clear content cache older than 1 day
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: deletedContent, error: contentError } = await supabase
      .from('content_cache')
      .delete()
      .lt('created_at', oneDayAgo.toISOString())

    if (contentError) {
      console.error('Error clearing content cache:', contentError)
      return NextResponse.json({ error: 'Failed to clear content cache' }, { status: 500 })
    }

    // Clear AI chat logs older than 30 days (keep some for analytics)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: deletedLogs, error: logsError } = await supabase
      .from('ai_chat_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (logsError) {
      console.warn('Warning: Could not clear old chat logs:', logsError)
    }

    // Clear image cache older than 7 days (if exists)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    try {
      const { data: deletedImages, error: imagesError } = await supabase
        .from('image_cache')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString())
    } catch (error) {
      // Image cache table might not exist, that's ok
      console.log('Image cache table not found or not accessible')
    }

    // Log the cleanup results
    console.log('✅ Daily cache cleanup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Daily cache cleanup completed',
      cleanupDate: new Date().toISOString(),
      details: {
        contentCacheCleared: 'Entries older than 1 day',
        chatLogsCleared: 'Entries older than 30 days',
        imageCacheCleared: 'Entries older than 7 days'
      }
    })

  } catch (error) {
    console.error('Error in daily cache cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to perform daily cache cleanup' },
      { status: 500 }
    )
  }
}

// For manual testing
export async function GET(request: NextRequest) {
  try {
    // Check cache status
    const { data: contentCount } = await supabase
      .from('content_cache')
      .select('id', { count: 'exact', head: true })

    const { data: recentContent } = await supabase
      .from('content_cache')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({
      status: 'Cache status check',
      contentCacheEntries: contentCount?.length || 0,
      latestCacheEntry: recentContent?.[0]?.created_at || null,
      nextCleanupWouldClear: 'Content older than 1 day'
    })

  } catch (error) {
    console.error('Error checking cache status:', error)
    return NextResponse.json(
      { error: 'Failed to check cache status' },
      { status: 500 }
    )
  }
}

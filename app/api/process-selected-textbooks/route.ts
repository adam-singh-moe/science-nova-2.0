import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🔄 POST /api/process-selected-textbooks - Starting...')
  
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get the list of textbook IDs to process
    const body = await request.json()
    const { textbookIds, selectAll } = body

    let finalTextbookIds: string[] = []

    if (selectAll) {
      console.log('📚 Processing all available textbooks...')
      // Get all textbook IDs from database
      const { data: allTextbooks, error: fetchError } = await supabase
        .from('textbook_uploads')
        .select('id')
        .eq('processed', false) // Only process unprocessed textbooks

      if (fetchError) {
        console.error('Error fetching all textbooks:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch textbooks' }, { status: 500 })
      }

      finalTextbookIds = allTextbooks?.map(t => t.id) || []
    } else if (textbookIds && Array.isArray(textbookIds)) {
      finalTextbookIds = textbookIds
    }

    if (finalTextbookIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No textbooks need processing',
        textbookIds: [] 
      })
    }

    console.log(`📚 Processing ${finalTextbookIds.length} selected textbooks:`, finalTextbookIds)

    // Mark selected textbooks as processing
    const { error: updateError } = await supabase
      .from('textbook_uploads')
      .update({ 
        processed: false,
        processing_started_at: new Date().toISOString(),
        processing_error: null 
      })
      .in('id', finalTextbookIds)

    if (updateError) {
      console.error('Error updating textbook status:', updateError)
      return NextResponse.json({ error: 'Failed to start processing' }, { status: 500 })
    }

    // Process textbooks in background
    processSelectedTextbooksBackground(finalTextbookIds)

    return NextResponse.json({ 
      success: true, 
      message: `Started processing ${finalTextbookIds.length} textbooks`,
      textbookIds: finalTextbookIds 
    })

  } catch (error) {
    console.error('💥 Error in process-selected-textbooks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processSelectedTextbooksBackground(textbookIds: string[]) {
  console.log('🚀 Starting background processing for selected textbooks')
  
  try {
    // Import the textbook processor
    const { processSpecificTextbooks } = await import('@/lib/textbook-processor')
    
    // Process the selected textbooks
    const result = await processSpecificTextbooks(textbookIds)
    
    console.log('✅ Background processing completed:', result)
    
  } catch (error) {
    console.error('💥 Background processing failed:', error)
    
    // Mark textbooks as failed
    await supabase
      .from('textbook_uploads')
      .update({ 
        processing_error: error instanceof Error ? error.message : 'Unknown error',
        processing_started_at: null
      })
      .in('id', textbookIds)
  }
}

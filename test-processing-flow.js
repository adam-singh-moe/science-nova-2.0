const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testProcessingFlow() {
  console.log('🧪 Testing the processing flow...')
  
  try {
    // First, let's mark one textbook as unprocessed for testing
    const { data: textbooks } = await supabaseAdmin
      .from('textbook_uploads')
      .select('id, file_name')
      .limit(1)
    
    if (!textbooks || textbooks.length === 0) {
      console.log('❌ No textbooks found')
      return
    }
    
    const testTextbook = textbooks[0]
    console.log(`📚 Using test textbook: ${testTextbook.file_name} (${testTextbook.id})`)
    
    // Mark it as unprocessed
    const { error: updateError } = await supabaseAdmin
      .from('textbook_uploads')
      .update({ 
        processed: false,
        processing_started_at: null,
        processing_error: null,
        chunks_created: 0
      })
      .eq('id', testTextbook.id)
    
    if (updateError) {
      console.error('❌ Failed to mark textbook as unprocessed:', updateError)
      return
    }
    
    console.log('✅ Marked textbook as unprocessed')
    
    // Now test the process API directly
    console.log('\n🔄 Testing processSpecificTextbooks function directly...')
    
    const { processSpecificTextbooks } = require('./lib/textbook-processor.ts')
    
    const result = await processSpecificTextbooks([testTextbook.id])
    
    console.log('\n📊 Processing result:', result)
    
    // Check final status
    const { data: finalStatus } = await supabaseAdmin
      .from('textbook_uploads')
      .select('processed, chunks_created, processing_error')
      .eq('id', testTextbook.id)
      .single()
    
    console.log('\n📋 Final textbook status:', finalStatus)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testProcessingFlow()

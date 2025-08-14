const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function resetTextbooksForTesting() {
  console.log('🔄 Resetting textbooks for testing...')
  
  try {
    // Mark one textbook as unprocessed for testing
    const { data: textbooks } = await supabaseAdmin
      .from('textbook_uploads')
      .select('id, file_name')
      .limit(2) // Test with 2 textbooks
    
    if (!textbooks || textbooks.length === 0) {
      console.log('❌ No textbooks found')
      return
    }
    
    console.log(`📚 Marking ${textbooks.length} textbooks as unprocessed for testing...`)
    textbooks.forEach(book => {
      console.log(`  - ${book.file_name}`)
    })
    
    // Mark them as unprocessed
    const { error: updateError } = await supabaseAdmin
      .from('textbook_uploads')
      .update({ 
        processed: false,
        processing_started_at: null,
        processing_error: null,
        chunks_created: 0
      })
      .in('id', textbooks.map(t => t.id))
    
    if (updateError) {
      console.error('❌ Failed to mark textbooks as unprocessed:', updateError)
      return
    }
    
    console.log('✅ Textbooks marked as unprocessed')
    console.log('🎯 Now you can test the "Process Textbooks" button in the admin dashboard!')
    console.log('📍 Go to: http://localhost:3001/admin')
    
  } catch (error) {
    console.error('❌ Reset failed:', error)
  }
}

resetTextbooksForTesting()

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to textbook_embeddings table...')
    
    // Try to insert a test record with basic required columns first
    const testRecord = {
      file_name: 'test.pdf',
      content: 'test content',
      embedding: new Array(1536).fill(0), // Default embedding vector
      chunk_index: 0
    }
    
    const { data: insertTest, error: insertError } = await supabase
      .from('textbook_embeddings')
      .insert(testRecord)
      .select()
    
    if (insertError) {
      console.log('❌ Basic insert failed:', insertError.message)
      console.log('🔧 This tells us what columns are missing or incorrect')
    } else {
      console.log('✅ Basic insert successful, checking what columns exist...')
      console.log('📊 Existing columns:', Object.keys(insertTest[0]))
      
      // Clean up test record
      await supabase
        .from('textbook_embeddings')
        .delete()
        .eq('file_name', 'test.pdf')
    }
    
    // Try to add the missing columns we need
    console.log('\n🔧 Attempting to add extraction_method column...')
    
    // Test insert with extraction_method
    const testWithMethod = {
      file_name: 'test2.pdf',
      content: 'test content 2',
      embedding: new Array(1536).fill(0),
      chunk_index: 0,
      extraction_method: 'docling-hybrid',
      processing_metadata: {
        test: true
      }
    }
    
    const { data: insertTest2, error: insertError2 } = await supabase
      .from('textbook_embeddings')
      .insert(testWithMethod)
      .select()
    
    if (insertError2) {
      console.log('❌ Insert with new columns failed:', insertError2.message)
      console.log('📝 This confirms we need to add these columns to the database schema')
    } else {
      console.log('✅ Insert with new columns successful!')
      console.log('📊 All columns:', Object.keys(insertTest2[0]))
      
      // Clean up test record
      await supabase
        .from('textbook_embeddings')
        .delete()
        .eq('file_name', 'test2.pdf')
    }
    
  } catch (error) {
    console.error('❌ Column check failed:', error.message)
  }
}

addMissingColumns()
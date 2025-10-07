const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixTableForProcessing() {
  try {
    console.log('🔧 Adapting processing script to existing table schema...')
    
    // Test with existing required columns
    const testRecord = {
      file_name: 'Science Around Us Book 1.pdf',
      content: 'Science Around US Book 1 Path Series Easy A GOGIEFA-FTI Project Acknowledgements',
      embedding: new Array(1536).fill(0.1), // Proper embedding vector
      chunk_index: 0,
      grade_level: 1 // Required column
    }
    
    console.log('📝 Testing insert with proper schema...')
    const { data: insertTest, error: insertError } = await supabase
      .from('textbook_embeddings')
      .insert(testRecord)
      .select()
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
    } else {
      console.log('✅ Insert successful!')
      console.log('📊 Available columns:', Object.keys(insertTest[0]))
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('textbook_embeddings')
        .delete()
        .eq('file_name', 'Science Around Us Book 1.pdf')
        .eq('chunk_index', 0)
      
      if (deleteError) {
        console.log('⚠️  Clean up warning:', deleteError.message)
      } else {
        console.log('🧹 Test record cleaned up')
      }
    }
    
    // Check current database state
    console.log('\n🔍 Checking current database state...')
    const { count, error: countError } = await supabase
      .from('textbook_embeddings')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('❌ Count error:', countError.message)
    } else {
      console.log(`📊 Current record count: ${count}`)
    }
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message)
  }
}

fixTableForProcessing()
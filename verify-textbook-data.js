const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyTextbookData() {
  console.log('🔍 Verifying textbook data access...')
  
  try {
    // Check textbook_uploads table directly
    console.log('\n📋 Checking textbook_uploads table...')
    const { data: uploads, error: uploadsError } = await supabase
      .from('textbook_uploads')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (uploadsError) {
      console.error('❌ Uploads error:', uploadsError)
    } else {
      console.log('✅ Found', uploads?.length || 0, 'textbook uploads')
      if (uploads && uploads.length > 0) {
        console.log('📚 Sample upload:', {
          id: uploads[0].id,
          file_name: uploads[0].file_name,
          grade_level: uploads[0].grade_level,
          processed: uploads[0].processed,
          chunks_created: uploads[0].chunks_created
        })
      }
    }
    
    // Check textbook_embeddings table
    console.log('\n📝 Checking textbook_embeddings table...')
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('textbook_embeddings')
      .select('grade_level, file_name')
      .limit(5)
    
    if (embeddingsError) {
      console.error('❌ Embeddings error:', embeddingsError)
    } else {
      console.log('✅ Found embeddings data')
      console.log('📊 Total chunks in database:', embeddings?.length || 0)
      if (embeddings && embeddings.length > 0) {
        console.log('📄 Sample embedding:', embeddings[0])
      }
    }
    
    // Check storage
    console.log('\n🗄️ Checking storage...')
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('textbook_content')
      .list('', { limit: 10 })
    
    if (storageError) {
      console.error('❌ Storage error:', storageError)
    } else {
      console.log('✅ Found', storageFiles?.length || 0, 'storage files')
      if (storageFiles && storageFiles.length > 0) {
        console.log('📁 Sample file:', storageFiles[0])
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

verifyTextbookData()

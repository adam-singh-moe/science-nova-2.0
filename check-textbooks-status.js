const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTextbooksStatus() {
  console.log('📊 Checking textbooks status...')
  
  try {
    // Check current textbook status
    const { data: textbooks, error: fetchError } = await supabaseAdmin
      .from('textbook_uploads')
      .select('id, file_name, processed, processing_started_at, processing_error, chunks_created')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Failed to fetch textbooks:', fetchError)
      return
    }
    
    console.log('\n📚 Current textbook status:')
    textbooks?.forEach((book, idx) => {
      console.log(`\n${idx + 1}. ${book.file_name} (ID: ${book.id})`)
      console.log(`   - Processed: ${book.processed}`)
      console.log(`   - Processing: ${book.processing_started_at ? 'Yes (started at ' + book.processing_started_at + ')' : 'No'}`)
      console.log(`   - Chunks: ${book.chunks_created || 0}`)
      console.log(`   - Error: ${book.processing_error || 'None'}`)
    })
    
    // Check embeddings count
    const { count: embeddingsCount, error: countError } = await supabaseAdmin
      .from('textbook_embeddings')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n📝 Total embeddings in database: ${embeddingsCount || 0}`)
    
    // Check which textbooks need processing
    const unprocessedBooks = textbooks?.filter(book => !book.processed) || []
    console.log(`\n⏳ Textbooks that need processing: ${unprocessedBooks.length}`)
    unprocessedBooks.forEach(book => {
      console.log(`   - ${book.file_name}`)
    })
    
  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

checkTextbooksStatus()

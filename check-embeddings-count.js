const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkEmbeddingsCount() {
  console.log('📊 Getting exact embeddings count...')
  
  // Get total count
  const { count, error } = await supabase
    .from('textbook_embeddings')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error('❌ Count error:', error)
  } else {
    console.log('✅ Total embeddings:', count)
  }
  
  // Get sample data with all fields
  const { data: sampleData, error: sampleError } = await supabase
    .from('textbook_embeddings')
    .select('*')
    .limit(3)
  
  if (sampleError) {
    console.error('❌ Sample error:', sampleError)
  } else {
    console.log('📄 Sample embeddings:')
    sampleData?.forEach((embedding, index) => {
      console.log(`  ${index + 1}.`, {
        id: embedding.id,
        file_name: embedding.file_name,
        grade_level: embedding.grade_level,
        chunk_index: embedding.chunk_index,
        content_preview: embedding.content?.substring(0, 100) + '...'
      })
    })
  }
}

checkEmbeddingsCount()

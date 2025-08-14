const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDataDirectly() {
  console.log('🔍 Direct data check with service role...')
  
  try {
    // Check uploads
    const { data: uploads, error: uploadsError } = await supabaseAdmin
      .from('textbook_uploads')
      .select('id, file_name, grade_level, chunks_created, processed')
      .order('created_at', { ascending: false })
    
    console.log('📚 Textbook Uploads:')
    if (uploadsError) {
      console.error('❌ Error:', uploadsError)
    } else {
      console.log(`✅ Found ${uploads?.length || 0} uploads`)
      uploads?.forEach((upload, idx) => {
        console.log(`  ${idx + 1}. ${upload.file_name} (Grade ${upload.grade_level}) - ${upload.chunks_created} chunks - ${upload.processed ? 'Processed' : 'Not processed'}`)
      })
    }
    
    // Check embeddings by grade
    const { data: embeddingStats, error: embeddingsError } = await supabaseAdmin
      .from('textbook_embeddings')
      .select('grade_level, file_name')
    
    console.log('\n📝 Textbook Embeddings:')
    if (embeddingsError) {
      console.error('❌ Error:', embeddingsError)
    } else {
      console.log(`✅ Found ${embeddingStats?.length || 0} total chunks`)
      
      // Group by grade
      const byGrade = {}
      embeddingStats?.forEach(chunk => {
        if (!byGrade[chunk.grade_level]) {
          byGrade[chunk.grade_level] = { files: new Set(), count: 0 }
        }
        byGrade[chunk.grade_level].files.add(chunk.file_name)
        byGrade[chunk.grade_level].count++
      })
      
      Object.entries(byGrade).forEach(([grade, stats]) => {
        console.log(`  Grade ${grade}: ${stats.count} chunks from ${stats.files.size} files`)
        stats.files.forEach(file => console.log(`    - ${file}`))
      })
    }
    
    // Check topics
    const { data: topics, error: topicsError } = await supabaseAdmin
      .from('topics')
      .select('id, title, grade_level')
    
    console.log('\n📖 Topics:')
    if (topicsError) {
      console.error('❌ Error:', topicsError)
    } else {
      console.log(`✅ Found ${topics?.length || 0} topics`)
      topics?.forEach(topic => {
        console.log(`  - ${topic.title} (Grade ${topic.grade_level})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

checkDataDirectly()

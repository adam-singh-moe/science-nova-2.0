require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function checkEmbeddingsTable() {
  console.log('🔍 Checking textbook_embeddings table...\n')

  try {
    // Check if textbook_embeddings table exists and has data
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('textbook_embeddings')
      .select('grade_level, file_name, chunk_index, content')
      .limit(5)
    
    if (embeddingsError) {
      console.error('❌ Embeddings error:', embeddingsError)
    } else {
      console.log(`✅ Found ${embeddings?.length || 0} sample textbook embeddings:`)
      embeddings?.forEach((embedding, index) => {
        console.log(`  ${index + 1}. ${embedding.file_name} (Grade ${embedding.grade_level})`)
        console.log(`     Chunk ${embedding.chunk_index}: ${embedding.content.substring(0, 100)}...`)
      })
    }

    // Get total count by grade level
    const { data: gradeStats, error: statsError } = await supabase
      .from('textbook_embeddings')
      .select('grade_level')
    
    if (!statsError && gradeStats) {
      console.log('\n📊 Chunks by grade level:')
      const gradeCounts = gradeStats.reduce((acc, item) => {
        acc[item.grade_level] = (acc[item.grade_level] || 0) + 1
        return acc
      }, {})
      
      Object.entries(gradeCounts).forEach(([grade, count]) => {
        console.log(`  Grade ${grade}: ${count} chunks`)
      })
      
      const totalChunks = gradeStats.length
      console.log(`\n📝 Total chunks in embeddings table: ${totalChunks}`)
    }

    // Check unique files
    const { data: uniqueFiles, error: filesError } = await supabase
      .from('textbook_embeddings')
      .select('file_name, grade_level')
    
    if (!filesError && uniqueFiles) {
      const fileGroups = uniqueFiles.reduce((acc, item) => {
        const key = `${item.file_name}_${item.grade_level}`
        if (!acc[key]) {
          acc[key] = { file_name: item.file_name, grade_level: item.grade_level, count: 0 }
        }
        acc[key].count++
        return acc
      }, {})
      
      console.log('\n📚 Files with chunk counts:')
      Object.values(fileGroups).forEach(file => {
        console.log(`  ${file.file_name} (Grade ${file.grade_level}): ${file.count} chunks`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkEmbeddingsTable()

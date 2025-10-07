const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testTextbookQuery() {
  try {
    console.log('🔍 Testing Textbook Query System with Docling OCR Results')
    console.log('=' .repeat(60))
    
    // Test query
    const testQuery = "What are the five senses?"
    console.log(`📝 Test Query: "${testQuery}"`)
    
    // Generate embedding for the query
    console.log('🧠 Generating query embedding...')
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
      dimensions: 1536
    })
    
    // Search for similar content
    console.log('🔍 Searching for similar content...')
    const { data: searchResults, error: searchError } = await supabase
      .rpc('match_textbook_content', {
        query_embedding: queryEmbedding.data[0].embedding,
        match_threshold: 0.5,
        match_count: 5
      })
    
    if (searchError) {
      console.error('❌ Search failed:', searchError.message)
      
      // Fallback: try direct similarity search
      console.log('🔄 Trying direct similarity search...')
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('textbook_embeddings')
        .select('file_name, content, chunk_index')
        .limit(5)
      
      if (fallbackError) {
        console.error('❌ Fallback search failed:', fallbackError.message)
        return
      }
      
      console.log(`✅ Found ${fallbackResults.length} sample chunks:`)
      fallbackResults.forEach((result, index) => {
        console.log(`\n${index + 1}. From: ${result.file_name} (Chunk ${result.chunk_index})`)
        console.log(`   Content preview: "${result.content.substring(0, 200)}..."`)
      })
      
    } else {
      console.log(`✅ Found ${searchResults.length} relevant matches:`)
      searchResults.forEach((result, index) => {
        console.log(`\n${index + 1}. From: ${result.file_name} (Chunk ${result.chunk_index})`)
        console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`)
        console.log(`   Content: "${result.content.substring(0, 300)}..."`)
      })
    }
    
    // Check database stats
    console.log('\n📊 Database Statistics:')
    const { data: stats, error: statsError } = await supabase
      .from('textbook_embeddings')
      .select('file_name')
    
    if (statsError) {
      console.error('❌ Stats error:', statsError.message)
    } else {
      const fileGroups = {}
      stats.forEach(record => {
        fileGroups[record.file_name] = (fileGroups[record.file_name] || 0) + 1
      })
      
      console.log(`   📚 Files: ${Object.keys(fileGroups).length}`)
      console.log(`   📦 Total chunks: ${stats.length}`)
      Object.entries(fileGroups).forEach(([fileName, count]) => {
        console.log(`      • ${fileName}: ${count} chunks`)
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testTextbookQuery()
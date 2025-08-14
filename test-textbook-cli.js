#!/usr/bin/env node

/**
 * Command-line test utility for textbook content retrieval
 * Usage: node test-textbook-cli.js "water cycle" 3 Biology
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration - replace with your actual values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function searchTextbookContent(query, gradeLevel, studyArea = null) {
  try {
    console.log(`🔍 Searching for: "${query}" (Grade ${gradeLevel}${studyArea ? `, ${studyArea}` : ''})`)
    console.log('=' .repeat(60))

    // First, check if we have any content for this grade
    const { data: gradeCheck, error: gradeError } = await supabase
      .from('textbook_embeddings')
      .select('id, file_name')
      .eq('grade_level', gradeLevel)
      .limit(5)

    if (gradeError) {
      throw gradeError
    }

    if (!gradeCheck || gradeCheck.length === 0) {
      console.log(`❌ No textbook content found for Grade ${gradeLevel}`)
      console.log('💡 Make sure textbooks have been processed for this grade level')
      return
    }

    console.log(`✅ Found textbook content for Grade ${gradeLevel}`)
    console.log(`📚 Available files: ${[...new Set(gradeCheck.map(c => c.file_name))].join(', ')}`)
    console.log('')

    // For demonstration, we'll simulate the embedding search
    // In a real implementation, you'd generate an embedding for the query
    console.log('🔄 Generating query embedding...')
    
    // Simulate finding relevant content based on text similarity
    const { data: allChunks, error: searchError } = await supabase
      .from('textbook_embeddings')
      .select('id, content, metadata, file_name, chunk_index')
      .eq('grade_level', gradeLevel)
      .order('chunk_index')

    if (searchError) {
      throw searchError
    }

    // Simple text-based filtering for demonstration
    const relevantChunks = allChunks.filter(chunk => {
      const content = chunk.content.toLowerCase()
      const queryLower = query.toLowerCase()
      const queryWords = queryLower.split(' ')
      
      // Score based on how many query words appear in the content
      const score = queryWords.reduce((acc, word) => {
        return acc + (content.includes(word) ? 1 : 0)
      }, 0)
      
      return score > 0
    }).slice(0, 5) // Limit to top 5 for demo

    console.log(`📊 Analysis Results:`)
    console.log(`   • Total chunks in grade: ${allChunks.length}`)
    console.log(`   • Relevant chunks found: ${relevantChunks.length}`)
    console.log('')

    if (relevantChunks.length === 0) {
      console.log('❌ No relevant content found for this query')
      console.log('💡 Try a different search term or check if the content exists in the textbook')
      return
    }

    console.log('📝 Relevant Content Chunks:')
    console.log('-'.repeat(60))

    relevantChunks.forEach((chunk, index) => {
      const preview = chunk.content.substring(0, 200) + '...'
      console.log(`\n${index + 1}. Chunk #${chunk.chunk_index} from ${chunk.file_name}`)
      console.log(`   Content: ${preview}`)
      console.log(`   Length: ${chunk.content.length} characters`)
      
      if (chunk.metadata) {
        console.log(`   Metadata: ${JSON.stringify(chunk.metadata, null, 2).substring(0, 100)}...`)
      }
    })

    console.log('\n' + '='.repeat(60))
    console.log('🤖 AI Prompt Construction:')
    
    const aiPrompt = constructAIPrompt(relevantChunks, query, gradeLevel, studyArea)
    console.log(`   Prompt length: ${aiPrompt.length} characters`)
    console.log(`   Content chunks included: ${relevantChunks.length}`)
    console.log('\n📋 Sample AI Prompt:')
    console.log('-'.repeat(40))
    console.log(aiPrompt.substring(0, 500) + '...')
    
    console.log('\n✅ Test completed successfully!')
    console.log(`💡 This content would be provided to the AI to generate curriculum-aligned responses about "${query}"`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

function constructAIPrompt(chunks, query, gradeLevel, studyArea) {
  let prompt = 'REFERENCE TEXTBOOK CONTENT:\n\n'
  
  chunks.forEach((chunk, index) => {
    prompt += `[Textbook Reference ${index + 1}]\n${chunk.content}\n\n`
  })
  
  prompt += `INSTRUCTIONS: Use the above textbook content as your primary reference when generating content about "${query}" for Grade ${gradeLevel}${studyArea ? ` ${studyArea}` : ''}. Ensure your generated content is aligned with and builds upon these textbook materials. Maintain accuracy while adapting the complexity to the student's learning preference.\n\n`
  
  return prompt
}

async function showGradeStatistics() {
  try {
    console.log('📊 Textbook Content Statistics by Grade:')
    console.log('=' .repeat(50))
    
    for (let grade = 1; grade <= 6; grade++) {
      const { data: gradeData, error } = await supabase
        .from('textbook_embeddings')
        .select('id, file_name, created_at')
        .eq('grade_level', grade)
      
      if (error) {
        console.error(`Error checking Grade ${grade}:`, error.message)
        continue
      }
      
      const chunkCount = gradeData?.length || 0
      const files = gradeData ? [...new Set(gradeData.map(d => d.file_name))] : []
      const lastProcessed = gradeData && gradeData.length > 0 
        ? new Date(Math.max(...gradeData.map(d => new Date(d.created_at).getTime()))).toLocaleDateString()
        : 'Never'
      
      console.log(`\nGrade ${grade}:`)
      console.log(`   📚 Files: ${files.length > 0 ? files.join(', ') : 'None'}`)
      console.log(`   📄 Chunks: ${chunkCount}`)
      console.log(`   📅 Last processed: ${lastProcessed}`)
    }
    
    console.log('\n' + '='.repeat(50))
  } catch (error) {
    console.error('❌ Failed to get statistics:', error.message)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('🧪 Textbook Content Testing Utility')
    console.log('')
    console.log('Usage:')
    console.log('  node test-textbook-cli.js "search query" <grade> [study_area]')
    console.log('  node test-textbook-cli.js --stats')
    console.log('')
    console.log('Examples:')
    console.log('  node test-textbook-cli.js "water cycle" 3')
    console.log('  node test-textbook-cli.js "photosynthesis" 5 Biology')
    console.log('  node test-textbook-cli.js --stats')
    console.log('')
    console.log('Environment variables required:')
    console.log('  NEXT_PUBLIC_SUPABASE_URL')
    console.log('  SUPABASE_SERVICE_ROLE_KEY')
    return
  }
  
  if (args[0] === '--stats' || args[0] === '-s') {
    await showGradeStatistics()
    return
  }
  
  const query = args[0]
  const gradeLevel = parseInt(args[1])
  const studyArea = args[2] || null
  
  if (!query || !gradeLevel || gradeLevel < 1 || gradeLevel > 6) {
    console.error('❌ Invalid arguments')
    console.error('Please provide a search query and grade level (1-6)')
    console.error('Example: node test-textbook-cli.js "water cycle" 3')
    process.exit(1)
  }
  
  await searchTextbookContent(query, gradeLevel, studyArea)
}

// Run the main function
main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})

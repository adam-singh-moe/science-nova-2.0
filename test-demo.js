/**
 * Demo script showing textbook content testing workflow
 * This demonstrates the testing process without requiring actual database access
 */

console.log('🧪 Textbook Content Testing Demo')
console.log('=' .repeat(60))

// Simulate testing a search query
function demoSearch(query, gradeLevel, studyArea = null) {
  console.log(`\n🔍 Testing Search: "${query}" (Grade ${gradeLevel}${studyArea ? `, ${studyArea}` : ''})`)
  console.log('-'.repeat(50))
  
  // Simulate finding relevant chunks
  const mockChunks = [
    {
      id: 'chunk_1',
      content: `The ${query} is a continuous process where water moves between oceans, land, and atmosphere. Water evaporates from surface water bodies due to heat from the sun, forming water vapor that rises into the atmosphere.`,
      similarity: 0.89,
      metadata: { file_name: `grade_${gradeLevel}_science.pdf`, chunk_index: 23 }
    },
    {
      id: 'chunk_2', 
      content: `When water vapor in the atmosphere cools down, it condenses around tiny particles to form clouds. This process is called condensation and is a key part of the ${query}.`,
      similarity: 0.76,
      metadata: { file_name: `grade_${gradeLevel}_science.pdf`, chunk_index: 24 }
    },
    {
      id: 'chunk_3',
      content: `Precipitation occurs when water droplets in clouds become too heavy and fall to Earth as rain, snow, sleet, or hail. This water then flows back to oceans and lakes, completing the cycle.`,
      similarity: 0.68,
      metadata: { file_name: `grade_${gradeLevel}_science.pdf`, chunk_index: 25 }
    }
  ]
  
  console.log('📊 Search Results:')
  console.log(`   • Total chunks found: ${mockChunks.length}`)
  console.log(`   • Average similarity: ${(mockChunks.reduce((sum, c) => sum + c.similarity, 0) / mockChunks.length).toFixed(3)}`)
  console.log(`   • Quality score: ${(mockChunks.filter(c => c.similarity > 0.7).length / mockChunks.length * 100).toFixed(1)}%`)
  
  console.log('\n📝 Retrieved Content Chunks:')
  mockChunks.forEach((chunk, index) => {
    console.log(`\n${index + 1}. Similarity: ${(chunk.similarity * 100).toFixed(1)}%`)
    console.log(`   File: ${chunk.metadata.file_name}`)
    console.log(`   Content: ${chunk.content.substring(0, 100)}...`)
  })
  
  // Show AI prompt construction
  console.log('\n🤖 AI Prompt Construction:')
  const aiPrompt = constructAIPrompt(mockChunks, query, gradeLevel, studyArea)
  console.log(`   Prompt length: ${aiPrompt.length} characters`)
  console.log(`   Content chunks included: ${mockChunks.length}`)
  
  console.log('\n📋 AI Prompt Preview:')
  console.log('-'.repeat(40))
  console.log(aiPrompt.substring(0, 300) + '...')
  
  return mockChunks
}

function constructAIPrompt(chunks, query, gradeLevel, studyArea) {
  let prompt = 'REFERENCE TEXTBOOK CONTENT:\n\n'
  
  chunks.forEach((chunk, index) => {
    prompt += `[Textbook Reference - Similarity: ${(chunk.similarity * 100).toFixed(1)}%]\n`
    prompt += `${chunk.content}\n\n`
  })
  
  prompt += `INSTRUCTIONS: Use the above textbook content as your primary reference when generating content about "${query}" for Grade ${gradeLevel}${studyArea ? ` ${studyArea}` : ''}. Ensure your generated content is aligned with and builds upon these textbook materials. Maintain accuracy while adapting the complexity to the student's learning preference.\n\n`
  
  return prompt
}

function showTestingOptions() {
  console.log('\n🛠️  Available Testing Methods:')
  console.log('=' .repeat(50))
  
  console.log('\n1. Web Interface Test:')
  console.log('   • Navigate to: http://localhost:3000/test-textbook')
  console.log('   • Interactive form with real-time results')
  console.log('   • Visual content inspection')
  console.log('   • Copy-to-clipboard functionality')
  
  console.log('\n2. API Endpoint Test:')
  console.log('   • GET /api/test-textbook-content (sample queries)')
  console.log('   • POST /api/test-textbook-content (run tests)')
  console.log('   • JSON response with detailed analysis')
  
  console.log('\n3. Command Line Test:')
  console.log('   • node test-textbook-cli.js "query" <grade> [subject]')
  console.log('   • Direct database access')
  console.log('   • Quick testing and debugging')
  
  console.log('\n4. Content Generation Integration:')
  console.log('   • Automatic in enhanced content APIs')
  console.log('   • /api/generate-enhanced-content')
  console.log('   • /api/generate-adventure-story')
}

function showGradeExamples() {
  console.log('\n📚 Sample Test Queries by Grade:')
  console.log('=' .repeat(50))
  
  const examples = {
    1: ['plants', 'weather', 'animals'],
    2: ['water cycle', 'magnets', 'rocks'], 
    3: ['states of matter', 'plant life cycle', 'solar system'],
    4: ['food chains', 'electricity', 'earth layers'],
    5: ['human body systems', 'chemical reactions', 'simple machines'],
    6: ['photosynthesis', 'periodic table', 'plate tectonics']
  }
  
  for (const [grade, queries] of Object.entries(examples)) {
    console.log(`\nGrade ${grade}:`)
    queries.forEach(query => {
      console.log(`   • "${query}"`)
    })
  }
}

// Run demo
console.log('\n🎯 Demo: Testing "water cycle" for Grade 3')
demoSearch('water cycle', 3, 'Meteorology')

showTestingOptions()
showGradeExamples()

console.log('\n✅ Demo Complete!')
console.log('\n💡 To run actual tests:')
console.log('   1. Set up environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY)')
console.log('   2. Process textbooks via Admin Dashboard')
console.log('   3. Use any of the testing methods shown above')
console.log('\n📖 See TEXTBOOK_TESTING_GUIDE.md for detailed instructions')

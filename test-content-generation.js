const fetch = require('node-fetch')

async function testContentGenerationAPI() {
  console.log('🧪 Testing Content Generation API...')
  
  try {
    // Get a topic ID from the database first
    const { createClient } = require('@supabase/supabase-js')
    require('dotenv').config({ path: '.env.local' })
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data: topics } = await supabase
      .from('topics')
      .select('id, title, grade_level')
      .limit(1)
    
    if (!topics || topics.length === 0) {
      console.log('❌ No topics found in database')
      return
    }
    
    const testTopic = topics[0]
    console.log(`📖 Testing with topic: ${testTopic.title} (${testTopic.id})`)
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3001/api/generate-enhanced-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topicId: testTopic.id
      })
    })
    
    console.log('📡 API Response status:', response.status)
    
    if (response.ok) {
      const content = await response.json()
      console.log('✅ API Success!')
      console.log('📊 Generated content structure:')
      console.log('  - Lesson content length:', content.lessonContent?.length || 0, 'characters')
      console.log('  - Flashcards:', content.flashcards?.length || 0)
      console.log('  - Quiz questions:', content.quiz?.length || 0)
      console.log('  - Textbook references used:', content.textbookReferences || 0)
      console.log('  - Processing time:', content.processingTime || 0, 'ms')
      
      if (content.flashcards && content.flashcards.length > 0) {
        console.log('📝 Sample flashcard:', content.flashcards[0])
      }
      
      if (content.quiz && content.quiz.length > 0) {
        console.log('🔍 Sample quiz question:', content.quiz[0])
      }
      
    } else {
      const errorText = await response.text()
      console.error('❌ API Error:', response.status, errorText)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testContentGenerationAPI()

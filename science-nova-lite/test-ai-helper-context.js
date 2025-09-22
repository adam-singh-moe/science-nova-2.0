/**
 * Test script to verify AI Helper enhanced context functionality
 */

const API_URL = 'http://localhost:3001'

async function testAIHelperContext() {
  console.log('🧪 Testing AI Helper Enhanced Context...')
  
  // Sample lesson data
  const testData = {
    tool: 'TEXT',
    prompt: 'Create an introduction paragraph about photosynthesis. — Lesson: Plant Biology Basics, Topic: Photosynthesis, Grade 6, Difficulty 2',
    topic: 'Photosynthesis',
    grade: 6,
    difficulty: 2,
    minWords: 50,
    maxWords: 100
  }
  
  try {
    const response = await fetch(`${API_URL}/api/ai-helper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This test assumes public access or would need proper auth token
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    console.log('📊 AI Helper Response Status:', response.status)
    console.log('📊 AI Helper Response:', result)
    
    if (result.success && result.content) {
      console.log('✅ AI Helper working with enhanced context!')
      console.log('📝 Generated content length:', result.content.length)
      console.log('📝 Content preview:', result.content.substring(0, 200) + '...')
    } else if (result.fallback) {
      console.log('⚠️ AI Helper using fallback mode')
      console.log('🔄 Reason:', result.reason || 'API quota/rate limit')
    } else {
      console.log('❌ AI Helper failed:', result.error || 'Unknown error')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAIHelperContext()
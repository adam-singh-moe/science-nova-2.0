// Simple test script to verify enhanced API functionality
// This tests the enhanced textbook search and content analysis features

const testEnhancedAIHelper = async () => {
  console.log('🧪 Testing Enhanced AI Helper API...')
  
  try {
    const response = await fetch('/api/ai-helper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'TEXT',
        grade: 6,
        topic: 'Photosynthesis',
        topicId: 'test-topic-id',
        prompt: 'Explain how plants make food',
        existingContent: [
          {
            kind: 'TEXT',
            data: { text: 'Plants are living organisms that need sunlight to survive.' }
          },
          {
            kind: 'FLASHCARDS',
            data: { 
              cards: [
                { q: 'What do plants need?', a: 'Sunlight, water, and nutrients' }
              ]
            }
          }
        ]
      })
    })

    const data = await response.json()
    
    console.log('✅ AI Helper API Response:')
    console.log('- Status:', response.status)
    console.log('- Has textbook integration:', response.headers.get('X-Textbook-Refs') || 'Not specified')
    console.log('- Response keys:', Object.keys(data))
    console.log('- Generated text length:', data.text?.length || 0)
    
    if (data.text) {
      console.log('- Generated content preview:', data.text.substring(0, 200) + '...')
    }
    
  } catch (error) {
    console.error('❌ Error testing AI Helper:', error)
  }
}

const testEnhancedContentGeneration = async () => {
  console.log('\n🧪 Testing Enhanced Content Generation API...')
  
  try {
    const response = await fetch('/api/generate-enhanced-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicId: 'test-topic-id'
      })
    })

    const data = await response.json()
    
    console.log('✅ Enhanced Content API Response:')
    console.log('- Status:', response.status)
    console.log('- Response time:', response.headers.get('X-Response-Time'))
    console.log('- Textbook references:', response.headers.get('X-Textbook-Refs'))
    console.log('- Has lesson content:', !!data.lessonContent)
    console.log('- Has flashcards:', Array.isArray(data.flashcards) && data.flashcards.length > 0)
    console.log('- Has quiz:', Array.isArray(data.quiz) && data.quiz.length > 0)
    console.log('- Textbook based:', data._textbookBased)
    
    if (data.lessonContent) {
      console.log('- Lesson content preview:', data.lessonContent.substring(0, 200) + '...')
    }
    
  } catch (error) {
    console.error('❌ Error testing Enhanced Content Generation:', error)
  }
}

// Run tests if this script is executed directly in a browser environment
if (typeof window !== 'undefined') {
  console.log('🚀 Starting Enhanced API Tests...')
  testEnhancedAIHelper()
    .then(() => testEnhancedContentGeneration())
    .then(() => console.log('\n✅ All tests completed!'))
    .catch(error => console.error('❌ Test suite failed:', error))
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testEnhancedAIHelper,
    testEnhancedContentGeneration
  }
}

console.log('📝 Test script created. To run these tests:')
console.log('1. Start the development server: npm run dev')
console.log('2. Open browser console on any page of the application')
console.log('3. Load and run this script')
console.log('4. Check console output for test results')
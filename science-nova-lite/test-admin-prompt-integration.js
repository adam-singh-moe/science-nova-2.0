/**
 * Test that AI Helper now considers admin prompts from topics
 */
require('dotenv').config({ path: '.env.local' })

async function testAdminPromptIntegration() {
  console.log('🧪 Testing Admin Prompt Integration with AI Helper...')
  
  try {
    // Test 1: Call AI Helper with a topicId that has an admin prompt
    console.log('\n📝 Test 1: AI Helper with topicId (should include admin prompt)')
    const response1 = await fetch('http://localhost:3000/api/ai-helper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'TEXT',
        prompt: 'Write about space exploration',
        topic: 'Test Topic - Space Exploration',
        topicId: '46b39a84-b436-4e3b-ad91-0ff2a3a4dc8e', // Topic with admin prompt
        grade: 4,
        difficulty: 2,
        minWords: 50,
        maxWords: 100
      })
    })
    
    console.log('📡 Response 1 status:', response1.status)
    const result1 = await response1.json()
    console.log('🤖 Generated text (with admin prompt):', result1.text?.substring(0, 200) + '...')
    
    // Test 2: Call AI Helper without topicId (should not include admin prompt)
    console.log('\n📝 Test 2: AI Helper without topicId (no admin prompt)')
    const response2 = await fetch('http://localhost:3000/api/ai-helper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'TEXT',
        prompt: 'Write about space exploration',
        topic: 'Test Topic - Space Exploration',
        grade: 4,
        difficulty: 2,
        minWords: 50,
        maxWords: 100
      })
    })
    
    console.log('📡 Response 2 status:', response2.status)
    const result2 = await response2.json()
    console.log('🤖 Generated text (without admin prompt):', result2.text?.substring(0, 200) + '...')
    
    // Compare results
    console.log('\n🔍 Analysis:')
    console.log('With admin prompt length:', result1.text?.length || 0)
    console.log('Without admin prompt length:', result2.text?.length || 0)
    
    if (result1.text && result2.text) {
      const isContentDifferent = result1.text !== result2.text
      console.log('Content differs when admin prompt is used:', isContentDifferent)
    }
    
    // Test debug mode to see if admin prompt is being used
    console.log('\n📝 Test 3: Debug mode to see admin prompt usage')
    const response3 = await fetch('http://localhost:3000/api/ai-helper?debug=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'TEXT',
        prompt: 'Write about space exploration',
        topic: 'Test Topic - Space Exploration',
        topicId: '46b39a84-b436-4e3b-ad91-0ff2a3a4dc8e',
        grade: 4,
        difficulty: 2
      })
    })
    
    const result3 = await response3.json()
    console.log('🐛 Debug info:', result3._debug)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAdminPromptIntegration()
/**
 * Debug script to test AI Helper functionality and identify exact issues
 */

const API_URL = 'http://localhost:3001'

async function testAIHelper() {
  console.log('🔍 Testing AI Helper - Debug Mode...')
  
  // Test 1: Text Generation
  console.log('\n📝 Testing TEXT generation...')
  try {
    const textTest = {
      tool: 'TEXT',
      prompt: 'Write about photosynthesis — Lesson: Plant Biology Basics, Topic: Photosynthesis, Grade 6, Difficulty 2',
      topic: 'Photosynthesis',
      grade: 6,
      difficulty: 2,
      minWords: 50,
      maxWords: 100
    }
    
    const textResponse = await fetch(`${API_URL}/api/ai-helper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textTest)
    })
    
    console.log('Text Response Status:', textResponse.status)
    const textResult = await textResponse.json()
    console.log('Text Result:', textResult)
    
  } catch (error) {
    console.error('❌ Text test failed:', error.message)
  }
  
  // Test 2: Check SimpleAI status
  console.log('\n🤖 Testing SimpleAI status...')
  try {
    const statusResponse = await fetch(`${API_URL}/api/test-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    console.log('Status Response Status:', statusResponse.status)
    const statusResult = await statusResponse.json()
    console.log('Status Result:', statusResult)
    
  } catch (error) {
    console.error('❌ Status test failed:', error.message)
  }
}

testAIHelper()
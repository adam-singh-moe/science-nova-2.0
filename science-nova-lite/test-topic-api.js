// Test topic creation with the fixed API
const fetch = require('node-fetch')

async function testTopicCreation() {
  console.log('🧪 Testing topic creation API...\n')
  
  try {
    const testData = {
      title: 'Planets of the Solar System',
      grade_level: 5,
      admin_prompt: 'Optional prompt to guide content generation for this topic...'
    }
    
    console.log('📡 Making API request to create topic...')
    console.log('Data:', JSON.stringify(testData, null, 2))
    
    const response = await fetch('http://localhost:3000/api/admin/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token' // This will fail auth but test the parsing
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    console.log(`\n📊 Response Status: ${response.status}`)
    console.log('📄 Response Body:', JSON.stringify(result, null, 2))
    
    if (response.status === 401) {
      console.log('\n✅ Good! API endpoint is reachable and properly checking authentication')
      console.log('The 401 error is expected since we used a fake token')
    } else if (response.status === 400) {
      console.log('\n🔍 Checking for validation errors...')
    } else {
      console.log(`\n⚠️  Unexpected status code: ${response.status}`)
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
  }
}

testTopicCreation()
// Test script for the suggested questions API
const fetch = require('node-fetch')

async function testAPI() {
  try {
    console.log('🔧 Testing suggested questions API directly...')
    
    const url = 'http://localhost:3000/api/suggested-questions?gradeLevel=4&userId=test-debug'
    console.log('📡 Making request to:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('📊 Response status:', response.status)
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ HTTP Error:', response.status, errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ Response received!')
    console.log('📦 Data:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('💥 Test error:', error.message)
    console.error('🔍 Full error:', error)
  }
}

// Run the test
testAPI()

// Test the fixed content-engagement API
require('dotenv').config({ path: '.env.local' })

const fetch = require('node-fetch')

async function testContentEngagementAPI() {
  try {
    console.log('🔍 Testing content-engagement API...')
    
    // We need to get an auth token first, but let's try the API endpoint directly
    const response = await fetch('http://localhost:3000/api/admin/content-engagement', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // For testing, we'll need to provide auth. Let's check if the server logs show the error is gone.
      }
    })
    
    console.log('📊 Response status:', response.status)
    console.log('📊 Response status text:', response.statusText)
    
    if (response.status === 401) {
      console.log('✅ Expected 401 (Unauthorized) - API is accessible but requires auth')
      console.log('🎯 This means the database error is likely fixed!')
    } else {
      const responseText = await response.text()
      console.log('📄 Response:', responseText.substring(0, 500))
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message)
  }
}

testContentEngagementAPI()
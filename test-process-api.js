const fetch = require('node-fetch')

async function testProcessAPI() {
  console.log('🧪 Testing Process Textbooks API...')
  
  try {
    // Test the API endpoint directly 
    const response = await fetch('http://localhost:3001/api/process-selected-textbooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // For now testing without auth to see basic API functionality
      },
      body: JSON.stringify({ selectAll: true })
    })
    
    console.log('📡 API Response status:', response.status)
    
    const result = await response.json()
    console.log('📊 API Response:', result)
    
    if (response.status === 401) {
      console.log('💡 Expected 401 - auth is working. This means the API endpoint is accessible!')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testProcessAPI()

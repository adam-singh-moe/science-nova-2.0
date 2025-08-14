// Test the admin API endpoint directly
async function testAdminAPI() {
  console.log('🧪 Testing Admin API directly...')
  
  try {
    // Test without authentication first to see the error response
    console.log('📡 Testing GET /api/admin/topics without auth...')
    const response = await fetch('http://localhost:3000/api/admin/topics')
    
    console.log('📊 Response status:', response.status)
    const result = await response.json()
    console.log('📊 Response:', JSON.stringify(result, null, 2))
    
    if (response.status === 401) {
      console.log('✅ Authentication check working - returns 401 without auth')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAdminAPI()

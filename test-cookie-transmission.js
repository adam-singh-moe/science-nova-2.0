const fetch = require('node-fetch');

async function testCookieTransmission() {
  console.log('🧪 Testing cookie transmission to /api/user-progress...');
  
  try {
    // Make a request to the API endpoint
    const response = await fetch('http://localhost:3000/api/user-progress', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Simulate a browser request without cookies
      },
    });
    
    const text = await response.text();
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('📊 Response body:', text);
    
    if (response.status === 401) {
      console.log('❌ As expected, 401 without cookies');
    }
    
  } catch (error) {
    console.error('❌ Error testing cookie transmission:', error.message);
  }
}

testCookieTransmission();

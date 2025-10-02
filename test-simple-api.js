// Simple API test without dependencies
const BASE_URL = 'http://localhost:3000';

async function testEndpoint(url, options = {}) {
  try {
    console.log(`Testing: ${url}`);
    
    // Use fetch (available in Node.js 18+)
    const response = await fetch(url, options);
    
    console.log(`Status: ${response.status}`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', data);
    } else {
      const text = await response.text();
      console.log('Response:', text.slice(0, 200) + '...');
    }
    
    return response;
  } catch (error) {
    console.error(`Error testing ${url}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('=== Testing Science Nova Content API Endpoints ===\n');
  
  // Test 1: Check if arcade GET endpoint exists
  console.log('1. Testing Arcade Content GET endpoint:');
  await testEndpoint(`${BASE_URL}/api/admin/arcade`);
  console.log('');
  
  // Test 2: Check if discovery GET endpoint exists  
  console.log('2. Testing Discovery Content GET endpoint:');
  await testEndpoint(`${BASE_URL}/api/admin/discovery`);
  console.log('');
  
  // Test 3: Check topics endpoint for context
  console.log('3. Testing Topics endpoint:');
  await testEndpoint(`${BASE_URL}/api/topics?limit=5`);
  console.log('');
  
  console.log('=== API Endpoint Test Complete ===');
}

runTests().catch(console.error);
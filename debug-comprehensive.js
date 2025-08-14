// Comprehensive cookie and session debugging script
const fetch = require('node-fetch');

async function comprehensiveDebugTest() {
  console.log('🧪 COMPREHENSIVE DEBUG TEST: Starting...\n');
  
  const baseUrl = 'http://localhost:3001';
  
  // Test 1: Call API without any authentication
  console.log('🧪 TEST 1: API call without authentication');
  try {
    const response = await fetch(`${baseUrl}/api/user-progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const text = await response.text();
    console.log('📊 Status:', response.status);
    console.log('📊 Response preview:', text.substring(0, 200));
    console.log('📊 Expected: 401 (Unauthorized)\n');
  } catch (error) {
    console.error('❌ Error in test 1:', error.message);
  }
  
  // Test 2: Check if the cookie debug page is accessible
  console.log('🧪 TEST 2: Cookie debug page accessibility');
  try {
    const response = await fetch(`${baseUrl}/cookie-debug.html`);
    console.log('📊 Cookie debug page status:', response.status);
    console.log('📊 Expected: 200 (should be accessible)\n');
  } catch (error) {
    console.error('❌ Error in test 2:', error.message);
  }
  
  // Test 3: Check environment variables accessibility
  console.log('🧪 TEST 3: Environment check');
  console.log('🔧 NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
  console.log('🔧 NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  console.log('🔧 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing\n');
  
  console.log('🧪 COMPREHENSIVE DEBUG TEST: Complete');
  console.log('📋 NEXT STEPS:');
  console.log('1. Open browser to http://localhost:3001');
  console.log('2. Log in as a user');
  console.log('3. Open browser console and run the auth-debug.js script');
  console.log('4. Go to http://localhost:3001/cookie-debug.html to see cookies');
  console.log('5. Check server terminal for detailed cookie debugging logs');
}

comprehensiveDebugTest();

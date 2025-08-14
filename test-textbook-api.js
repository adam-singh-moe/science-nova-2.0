const fetch = require('node-fetch');

// Test the textbook processing API
async function testTextbookProcessing() {
  try {
    console.log('Testing textbook processing API...');
    
    const response = await fetch('http://localhost:3000/api/process-textbooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZ2ZkZW9xenh4ZGd2ZmlyZHpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY0NTMwOSwiZXhwIjoyMDY1MjIxMzA5fQ.iVNR3fNNLMyk8iHwsGX7tQ79pdRDRIY7klfLIz9tw3g'
      },
      body: JSON.stringify({})
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ API call successful');
    } else {
      console.log('❌ API call failed');
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testTextbookProcessing();

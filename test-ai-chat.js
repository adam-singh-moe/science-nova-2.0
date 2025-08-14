const fetch = require('node-fetch');

async function testAIChat() {
  try {
    console.log('🧪 Testing AI Chat API...\n');

    // Test data - you'll need to replace with a real user ID from your database
    const testData = {
      message: "How do plants make their own food?",
      userId: "00000000-0000-0000-0000-000000000000", // Replace with real user ID
      gradeLevel: 3,
      learningPreference: "visual"
    };

    console.log('📤 Sending request to /api/ai-chat...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('\n📊 Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ SUCCESS!');
      console.log('AI Response:', data.response);
      console.log('Has Textbook Content:', data.relevantContentFound);
      console.log('Content Sources:', data.contentSources);
    } else {
      console.log('\n❌ ERROR!');
      console.log('Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
    }

  } catch (error) {
    console.error('\n💥 NETWORK ERROR:', error.message);
    console.log('Make sure your development server is running on localhost:3000');
  }
}

// Run the test
testAIChat();

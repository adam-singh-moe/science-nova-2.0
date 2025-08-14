require('dotenv').config({ path: '.env.local' });

async function testAIChatEndpoint() {
  const testUrl = 'http://localhost:3000/api/ai-chat';
  
  // Test data - simulating an authenticated user
  const testData = {
    message: "How do plants make their own food?",
    userId: "test-user-123", // Not demo user, so should use real AI
    gradeLevel: 3,
    learningPreference: "visual"
  };

  console.log('🧪 Testing AI Chat Endpoint...');
  console.log('📤 Sending request:', testData);

  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('\n📥 Response received:');
    console.log('✅ Success:', response.ok);
    console.log('📝 Response:', result.response);
    console.log('📚 Has textbook content:', result.relevantContentFound);
    console.log('📊 Content sources:', result.contentSources);
    console.log('🎓 Grade level:', result.gradeLevel);
    console.log('📖 Textbook sources:', result.textbookSources);

    // Test with demo user too
    console.log('\n🧪 Testing with demo user...');
    const demoData = {
      ...testData,
      userId: "demo-user-001"
    };

    const demoResponse = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(demoData)
    });

    const demoResult = await demoResponse.json();
    console.log('📝 Demo Response:', demoResult.response);
    console.log('📚 Demo Has textbook content:', demoResult.relevantContentFound);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the Next.js development server is running with: npm run dev');
    }
  }
}

testAIChatEndpoint();

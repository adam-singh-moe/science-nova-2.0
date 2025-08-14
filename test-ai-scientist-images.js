const fetch = require('node-fetch');

async function testAIScientistWithImages() {
  console.log('🧪 Testing AI Scientist with Image Generation...\n');
  
  // Test data that should trigger image generation
  const testData = {
    message: "How do plants make their own food? Can you show me the parts of a plant?",
    userId: "test-user-123", // Use non-demo user to trigger real AI
    gradeLevel: 4,
    learningPreference: "visual",
    timestamp: Date.now(),
    requestId: Date.now() + "-image-test",
    source: "ai-scientist-test"
  };

  console.log('📤 Sending request to /api/ai-chat...');
  console.log('Request data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Request-ID': testData.requestId.toString()
      },
      cache: 'no-store',
      body: JSON.stringify(testData),
    });

    console.log('\n📊 Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ HTTP ERROR:', response.status, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('\n✅ SUCCESS!');
    console.log('📝 AI Response Length:', data.response?.length || 0);
    console.log('📚 Has Textbook Content:', data.relevantContentFound);
    console.log('📊 Content Sources:', data.contentSources);
    console.log('🎓 Grade Level:', data.gradeLevel);
    console.log('🖼️ Images Generated:', data.images?.length || 0);
    
    if (data.images && data.images.length > 0) {
      console.log('\n🎨 Generated Images:');
      data.images.forEach((imageUrl, index) => {
        console.log(`  ${index + 1}. ${imageUrl}`);
      });
    }
    
    console.log('\n📖 Textbook Sources:', data.textbookSources);
    console.log('\n📝 Full Response:');
    console.log(data.response);

  } catch (error) {
    console.error('\n💥 NETWORK ERROR:', error.message);
    console.log('Make sure your development server is running on localhost:3000');
  }
}

// Run the test
testAIScientistWithImages();

const fetch = require('node-fetch');

async function testAIWithMockResponse() {
  console.log('🧪 Testing AI Chat with Mock Response + Image Generation...');
  
  // Create a test message that should trigger image generation
  const testData = {
    message: "How do plants make their own food? Can you show me the parts of a plant?",
    userId: "test-user-image-gen", // Different from demo user
    gradeLevel: 4,
    learningPreference: "visual"
  };

  try {
    console.log('📤 Sending request to /api/ai-chat...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS!');
      console.log('📝 AI Response Length:', data.response.length);
      console.log('📚 Has Textbook Content:', data.relevantContentFound);
      console.log('📊 Content Sources:', data.contentSources);
      console.log('🎓 Grade Level:', data.gradeLevel);
      console.log('🖼️ Images Generated:', data.images ? data.images.length : 0);
      
      if (data.images && data.images.length > 0) {
        console.log('🎨 Generated Images:');
        data.images.forEach((img, i) => {
          console.log(`  ${i + 1}. ${img.substring(0, 50)}...`);
        });
      }
      
      console.log('📖 Textbook Sources:', data.textbookSources);
      console.log('📝 Full Response:');
      console.log(data.response);
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED!');
      console.log('📝 Error Response:', errorText);
    }
  } catch (error) {
    console.log('💥 NETWORK ERROR:', error.message);
    console.log('Make sure your development server is running on localhost:3000');
  }
}

testAIWithMockResponse();

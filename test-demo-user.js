const fetch = require('node-fetch');

async function testDemoUser() {
  console.log('🧪 Testing Demo User (should use mock responses)...\n');
  
  const testData = {
    message: "What are the different types of rocks?",
    userId: "demo-user-001", // Demo user
    gradeLevel: 3,
    learningPreference: "visual"
  };

  try {
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    console.log('✅ Demo User Test Result:');
    console.log('📝 Response:', data.response);
    console.log('📚 Has Textbook Content:', data.relevantContentFound);
    console.log('🖼️ Images Generated:', data.images?.length || 0);
    
  } catch (error) {
    console.error('❌ Demo test failed:', error.message);
  }
}

testDemoUser();

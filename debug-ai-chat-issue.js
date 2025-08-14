// Debug script to test AI Chat functionality and identify issues

const fetch = require('node-fetch');

async function debugAIChat() {
  console.log('🔍 Debugging AI Chat Issue...\n');

  const baseUrl = 'http://localhost:3000';
  const userId = 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333'; // User ID from the issue report

  // Test different scenarios
  const testCases = [
    {
      name: "Original User Question",
      data: {
        message: "Hi what are the parts of a flower?",
        userId: userId,
        gradeLevel: 4,
        learningPreference: "VISUAL"
      }
    },
    {
      name: "Different Question Same User",
      data: {
        message: "How do plants grow?",
        userId: userId,
        gradeLevel: 4,
        learningPreference: "VISUAL"
      }
    },
    {
      name: "Demo User Test",
      data: {
        message: "Hi what are the parts of a flower?",
        userId: "demo-user-001",
        gradeLevel: 4,
        learningPreference: "VISUAL"
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log(`📤 Request: ${JSON.stringify(testCase.data, null, 2)}`);

    try {
      const response = await fetch(`${baseUrl}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        continue;
      }

      const data = await response.json();
      
      console.log(`✅ Response Status: ${response.status}`);
      console.log(`📝 AI Response: ${data.response.substring(0, 100)}...`);
      console.log(`🎓 Grade Level: ${data.gradeLevel}`);
      console.log(`📚 Has Textbook Content: ${data.relevantContentFound}`);
      console.log(`📊 Content Sources: ${data.contentSources}`);
      console.log(`📖 Textbook Sources: ${JSON.stringify(data.textbookSources)}`);
      
      // Check if response seems like a fallback
      if (data.response.includes("Science is amazing, isn't it?") || 
          data.response.includes("simple circuits") ||
          data.response.includes("perfect topic to explore")) {
        console.warn("⚠️  This looks like a fallback/mock response!");
      }

    } catch (error) {
      console.error(`💥 Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }

  // Check environment variables
  console.log('🔧 Environment Check:');
  try {
    const envCheck = await fetch(`${baseUrl}/api/health-check`, {
      method: 'GET'
    });
    
    if (envCheck.ok) {
      console.log('✅ Server is responsive');
    } else {
      console.log('❌ Server health check failed');
    }
  } catch (error) {
    console.log('❌ Could not reach server');
  }

  console.log('\n📋 Recommendations:');
  console.log('1. Clear browser cache and cookies');
  console.log('2. Check browser Network tab for failed requests');
  console.log('3. Verify authentication status in the app');
  console.log('4. Try refreshing the page');
  console.log('5. Check if user profile has correct grade level set');
}

// Run the debug
debugAIChat().catch(console.error);

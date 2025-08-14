// Frontend Fix Verification Script
// Tests that the frontend improvements are working correctly

const fetch = require('node-fetch');

async function testFrontendFixes() {
  console.log('🔧 Testing Frontend AI Chat Fixes...\n');

  const baseUrl = 'http://localhost:3000';
  const userId = 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333'; // The problematic user ID

  // Test multiple requests to ensure no caching issues
  const testCases = [
    {
      name: "Original Problem Question",
      message: "Hi what are the parts of a flower?",
      expectedKeywords: ["petals", "stamens", "pistil", "sepals"]
    },
    {
      name: "Different Question Same User", 
      message: "How do plants grow?",
      expectedKeywords: ["seeds", "water", "sunlight", "roots"]
    },
    {
      name: "Another Variation",
      message: "What makes plants green?",
      expectedKeywords: ["chlorophyll", "green", "leaves"]
    }
  ];

  console.log(`👤 Testing with User ID: ${userId}`);
  console.log(`🎓 Testing with Grade Level: 4`);
  console.log(`👁️ Testing with Learning Preference: VISUAL\n`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📋 Test ${i + 1}: ${testCase.name}`);
    console.log(`❓ Question: "${testCase.message}"`);

    try {
      // Add unique identifiers to prevent caching
      const requestData = {
        message: testCase.message,
        userId: userId,
        gradeLevel: 4,
        learningPreference: "VISUAL",
        timestamp: Date.now(),
        requestId: `test-${i}-${Date.now()}-${Math.random()}`
      };

      const response = await fetch(`${baseUrl}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-ID': requestData.requestId
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      // Analyze response
      const analysis = {
        status: response.status,
        hasResponse: !!data.response,
        responseLength: data.response?.length || 0,
        hasTextbookContent: data.relevantContentFound,
        gradeLevel: data.gradeLevel,
        isFallback: data.response?.includes("Science is amazing, isn't it?") || 
                   data.response?.includes("simple circuits") ||
                   data.response?.includes("perfect topic to explore"),
        isUnique: !data.response?.includes("Science is amazing, isn't it?"),
        containsExpectedContent: testCase.expectedKeywords.some(keyword => 
          data.response?.toLowerCase().includes(keyword.toLowerCase())
        )
      };

      console.log(`✅ Status: ${analysis.status}`);
      console.log(`📝 Response Length: ${analysis.responseLength} characters`);
      console.log(`📚 Has Textbook Content: ${analysis.hasTextbookContent}`);
      console.log(`🎓 Grade Level: ${analysis.gradeLevel}`);
      console.log(`🔄 Is Unique (not fallback): ${analysis.isUnique}`);
      console.log(`🎯 Contains Expected Content: ${analysis.containsExpectedContent}`);
      
      if (analysis.isFallback) {
        console.log(`⚠️  WARNING: This appears to be a fallback response!`);
        console.log(`📄 Response Preview: ${data.response.substring(0, 100)}...`);
      } else {
        console.log(`✅ SUCCESS: Generated unique AI response`);
        console.log(`📄 Response Preview: ${data.response.substring(0, 100)}...`);
      }

      // Check for expected content
      if (analysis.containsExpectedContent) {
        console.log(`✅ Content validation passed`);
      } else {
        console.log(`⚠️  Content validation: Expected keywords not found`);
        console.log(`🔍 Expected keywords: ${testCase.expectedKeywords.join(', ')}`);
      }

    } catch (error) {
      console.error(`💥 Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');
    
    // Add delay between requests to avoid rate limiting
    if (i < testCases.length - 1) {
      console.log('⏳ Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('🎯 Test Summary:');
  console.log('✅ If all tests show "Generated unique AI response", the frontend fixes are working!');
  console.log('❌ If tests show "fallback response", there may still be caching issues.');
  console.log('\n💡 If problems persist:');
  console.log('1. Clear browser cache completely (Ctrl+Shift+R)');
  console.log('2. Try incognito/private browsing mode');
  console.log('3. Check browser console for error messages');
  console.log('4. Use the "Clear Chat" button (trash icon) in the chat interface');
}

// Run the test
testFrontendFixes().catch(console.error);

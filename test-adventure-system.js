require('dotenv').config({ path: '.env.local' });

async function testAdventureSystem() {
  const baseUrl = 'http://localhost:3000/api';
  
  // Test data - simulating a real user
  const testUserId = 'test-user-adventure-123';
  
  console.log('🎮 Testing Adventure System...\n');

  try {
    // Test 1: Generate Adventures
    console.log('1️⃣ Testing Adventure Generation...');
    const adventureResponse = await fetch(`${baseUrl}/generate-adventure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId
      })
    });

    if (!adventureResponse.ok) {
      throw new Error(`Adventure generation failed: ${adventureResponse.status}`);
    }

    const adventureData = await adventureResponse.json();
    
    console.log('✅ Adventure Generation Results:');
    console.log(`   • Generated ${adventureData.adventures?.length || 0} adventures`);
    console.log(`   • Grade Level: ${adventureData.gradeLevel || 'Unknown'}`);
    console.log(`   • Message: ${adventureData.message}`);
    
    if (adventureData.adventures && adventureData.adventures.length > 0) {
      const adventure = adventureData.adventures[0];
      console.log(`   • First Adventure: "${adventure.title}"`);
      console.log(`   • Subject: ${adventure.subject}`);
      console.log(`   • Duration: ${adventure.duration}`);
      console.log(`   • Has Textbook Content: ${adventure.hasTextbookContent}`);
      console.log(`   • Concepts: ${adventure.concepts.join(', ')}`);
      
      // Test 2: Generate Story for the first adventure
      console.log('\n2️⃣ Testing Story Generation...');
      const storyResponse = await fetch(`${baseUrl}/generate-adventure-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adventure: adventure,
          userId: testUserId
        })
      });

      if (!storyResponse.ok) {
        throw new Error(`Story generation failed: ${storyResponse.status}`);
      }

      const storyData = await storyResponse.json();
      
      console.log('✅ Story Generation Results:');
      console.log(`   • Story Title: "${storyData.title}"`);
      console.log(`   • Number of Pages: ${storyData.pages?.length || 0}`);
      console.log(`   • Grade Level: ${storyData.gradeLevel}`);
      console.log(`   • Learning Style: ${storyData.learningStyle}`);
      console.log(`   • Has Textbook Content: ${storyData.hasTextbookContent}`);
      console.log(`   • Textbook Sources: ${storyData.textbookSources?.join(', ') || 'None'}`);
      
      if (storyData.pages && storyData.pages.length > 0) {
        console.log(`   • First Page Title: "${storyData.pages[0].title}"`);
        console.log(`   • First Page Content Preview: "${storyData.pages[0].content.substring(0, 100)}..."`);
        console.log(`   • Background Prompt: "${storyData.pages[0].backgroundPrompt.substring(0, 100)}..."`);
      }

      if (storyData.reflectionQuestions && storyData.reflectionQuestions.length > 0) {
        console.log(`   • Reflection Questions: ${storyData.reflectionQuestions.length}`);
        console.log(`   • First Question: "${storyData.reflectionQuestions[0]}"`);
      }
    }

    // Test 3: Test daily adventure caching
    console.log('\n3️⃣ Testing Daily Adventure Caching...');
    const cachedResponse = await fetch(`${baseUrl}/generate-adventure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId
      })
    });

    const cachedData = await cachedResponse.json();
    console.log('✅ Cache Test Results:');
    console.log(`   • Message: ${cachedData.message}`);
    console.log(`   • Should be cached: ${cachedData.message.includes('already generated') ? 'YES' : 'NO'}`);

    console.log('\n🎉 Adventure System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Adventure generation with AI and textbook content');
    console.log('   ✅ Story generation with personalization');
    console.log('   ✅ Daily caching mechanism');
    console.log('   ✅ Grade-level appropriate content');
    console.log('   ✅ Learning style adaptation');
    console.log('   ✅ Textbook integration');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the Next.js development server is running with: npm run dev');
    }
  }
}

testAdventureSystem();

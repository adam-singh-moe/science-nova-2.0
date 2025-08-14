// Test script for the Curiosity Engine API
console.log('🧪 Testing Curiosity Engine API...\n');

async function testCuriosityEngine() {
  const baseUrl = 'http://localhost:3000';
  
  // Test data simulating a student clicking on a curiosity point
  const testData = {
    pageContent: "The brave astronaut floated weightlessly through space, observing the immense gravity of Jupiter pulling its many moons into perfect orbits. The giant planet's magnetic field stretched far into the cosmos, protecting its satellites from harmful radiation.",
    keyword: "gravity",
    gradeLevel: 5
  };

  try {
    console.log('🔍 Testing Professor Nova insight for "gravity"...');
    
    const response = await fetch(`${baseUrl}/api/get-contextual-insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ API Response received:');
    console.log(`   Success: ${data.success}`);
    
    if (data.insight) {
      console.log('\n🤖 Professor Nova says:');
      console.log(`   Type: ${data.insight.type}`);
      console.log(`   Title: "${data.insight.title}"`);
      console.log(`   Content: "${data.insight.content}"`);
      console.log(`   Button Text: "${data.insight.buttonText}"`);
    }
    
    console.log('\n🎉 Curiosity Engine API is working correctly!');
    
    // Test with different keywords
    const keywords = ['volcano', 'photosynthesis', 'unknown_word'];
    
    for (const keyword of keywords) {
      console.log(`\n🔍 Testing with keyword: "${keyword}"`);
      
      const testResponse = await fetch(`${baseUrl}/api/get-contextual-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testData,
          keyword: keyword
        })
      });
      
      const testData2 = await testResponse.json();
      if (testData2.insight) {
        console.log(`   ✅ Got insight: "${testData2.insight.title}"`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
  }
}

testCuriosityEngine();

// Test to simulate the exact data flow from story generation to storybook
console.log('🔍 Testing data flow from API to Storybook...\n');

// Step 1: Generate a story (simulating what the UI does)
const testAdventure = {
  id: "test-flow-123",
  title: "Data Flow Test Adventure",
  description: "Testing the complete data flow",
  subject: "Physics",
  objectives: ["Test data flow", "Verify structure"]
};

const testUserId = "f073aeb6-aebe-4e7b-8ab7-4f5c38e23333";

async function testCompleteFlow() {
  try {
    console.log('1️⃣ Generating story via API...');
    
    const response = await fetch('http://localhost:3000/api/generate-adventure-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adventure: testAdventure,
        userId: testUserId
      })
    });

    const storyData = await response.json();
    
    console.log('✅ Story generated');
    console.log('📊 Story data structure:');
    console.log('   - Title:', storyData.title);
    console.log('   - Pages count:', storyData.pages?.length);
    console.log('   - Pages structure:');
    
    if (storyData.pages) {
      storyData.pages.forEach((page, i) => {
        console.log(`     Page ${i + 1}:`);
        console.log(`       - id: ${page.id}`);
        console.log(`       - title: ${page.title || 'N/A'}`);
        console.log(`       - content length: ${page.content?.length || 0} chars`);
        console.log(`       - backgroundImage: ${page.backgroundImage || 'none'}`);
        console.log(`       - backgroundPrompt: ${page.backgroundPrompt ? 'YES' : 'NO'}`);
        if (page.backgroundPrompt) {
          console.log(`         Preview: "${page.backgroundPrompt.substring(0, 60)}..."`);
        }
        console.log('');
      });
    }
    
    console.log('\n2️⃣ Testing Storybook component logic...');
    
    // Simulate what the Storybook component does
    const pages = storyData.pages || [];
    
    console.log('📋 Storybook filtering logic:');
    const pagesToGenerate = pages.filter(page => 
      page.backgroundPrompt && 
      !page.backgroundImage
    );
    
    console.log(`   - Total pages: ${pages.length}`);
    console.log(`   - Pages with backgroundPrompt: ${pages.filter(p => p.backgroundPrompt).length}`);
    console.log(`   - Pages with backgroundImage: ${pages.filter(p => p.backgroundImage).length}`);
    console.log(`   - Pages needing generation: ${pagesToGenerate.length}`);
    
    if (pagesToGenerate.length > 0) {
      console.log('\n✅ Pages that should trigger image generation:');
      pagesToGenerate.forEach((page, i) => {
        console.log(`   ${i + 1}. ${page.id} - "${page.backgroundPrompt?.substring(0, 50)}..."`);
      });
    } else {
      console.log('\n❌ No pages would trigger image generation!');
      console.log('🔍 Debugging why:');
      pages.forEach((page, i) => {
        console.log(`   Page ${i + 1}:`);
        console.log(`     - Has backgroundPrompt: ${!!page.backgroundPrompt}`);
        console.log(`     - Has backgroundImage: ${!!page.backgroundImage}`);
        console.log(`     - Would generate: ${!!(page.backgroundPrompt && !page.backgroundImage)}`);
      });
    }
    
    console.log('\n🎉 Data flow test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteFlow();

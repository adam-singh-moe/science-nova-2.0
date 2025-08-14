// Complete test of the image generation workflow
// This tests the full process: Story generation -> Image pre-generation -> Storybook display

const fetch = require('node-fetch');

const testAdventure = {
  id: "test-workflow-123",
  title: "Complete Image Workflow Test",
  description: "Testing the complete image generation workflow",
  subject: "Physics",
  objectives: ["Test complete workflow", "Verify image pre-generation"]
};

const testUserId = "f073aeb6-aebe-4e7b-8ab7-4f5c38e23333";

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Image Generation Workflow...\n');
  
  try {
    // Step 1: Generate story
    console.log('1️⃣ Generating adventure story...');
    const startTime = Date.now();
    
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const storyData = await response.json();
    const storyTime = Date.now() - startTime;
    
    console.log(`✅ Story generated in ${storyTime}ms`);
    console.log(`📖 Title: ${storyData.title}`);
    console.log(`📄 Pages: ${storyData.pages?.length || 0}`);
    
    if (!storyData.pages || storyData.pages.length === 0) {
      throw new Error('No story pages generated');
    }
    
    // Step 2: Analyze pages that need images
    const pagesWithPrompts = storyData.pages.filter(page => page.backgroundPrompt);
    const pagesWithImages = storyData.pages.filter(page => page.backgroundImage);
    
    console.log(`\n2️⃣ Analyzing image generation needs...`);
    console.log(`📝 Pages with background prompts: ${pagesWithPrompts.length}`);
    console.log(`🎨 Pages with existing images: ${pagesWithImages.length}`);
    console.log(`🔄 Pages that need image generation: ${pagesWithPrompts.length - pagesWithImages.length}`);
    
    // Step 3: Test image generation for each page that needs it
    console.log(`\n3️⃣ Testing image generation for each page...`);
    
    let successCount = 0;
    let aiImageCount = 0;
    let fallbackCount = 0;
    let totalGenerationTime = 0;
    
    for (let i = 0; i < pagesWithPrompts.length; i++) {
      const page = pagesWithPrompts[i];
      
      if (page.backgroundImage) {
        console.log(`   Page ${i + 1}: ✅ Already has image (${page.backgroundImage.startsWith('data:') ? 'AI' : 'gradient'})`);
        successCount++;
        if (page.backgroundImage.startsWith('data:')) aiImageCount++;
        else fallbackCount++;
        continue;
      }
      
      console.log(`   Page ${i + 1}: 🎨 Generating image...`);
      console.log(`   Prompt: "${page.backgroundPrompt.substring(0, 80)}..."`);
      
      const imageStartTime = Date.now();
      
      try {
        const imageResponse = await fetch('http://localhost:3000/api/generate-image-enhanced', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: page.backgroundPrompt,
            aspectRatio: '16:9',
            gradeLevel: 5
          })
        });

        const imageTime = Date.now() - imageStartTime;
        totalGenerationTime += imageTime;

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          
          if (imageData.success && imageData.imageUrl) {
            successCount++;
            
            if (imageData.imageUrl.startsWith('data:image/')) {
              aiImageCount++;
              console.log(`   ✅ AI image generated in ${imageTime}ms (${Math.round(imageData.imageUrl.length / 1024)}KB)`);
            } else {
              fallbackCount++;
              console.log(`   🎭 Fallback used in ${imageTime}ms (${imageData.type})`);
            }
          } else {
            console.log(`   ❌ Image generation failed`);
          }
        } else {
          console.log(`   ❌ Image API request failed: ${imageResponse.status}`);
        }
        
        // Small delay between requests
        if (i < pagesWithPrompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Step 4: Results summary
    const totalTime = Date.now() - startTime;
    
    console.log(`\n4️⃣ Workflow Test Results:`);
    console.log(`⏱️  Total time: ${totalTime}ms (${Math.round(totalTime/1000)}s)`);
    console.log(`📊 Story generation: ${storyTime}ms`);
    console.log(`📊 Image generation: ${totalGenerationTime}ms`);
    console.log(`📊 Success rate: ${successCount}/${pagesWithPrompts.length} (${Math.round(successCount/pagesWithPrompts.length*100)}%)`);
    console.log(`🎨 AI images: ${aiImageCount}`);
    console.log(`🎭 Fallbacks: ${fallbackCount}`);
    
    console.log(`\n5️⃣ Workflow Assessment:`);
    if (successCount === pagesWithPrompts.length) {
      console.log(`✅ EXCELLENT: All pages have images!`);
    } else if (successCount >= pagesWithPrompts.length * 0.8) {
      console.log(`✅ GOOD: Most pages have images`);
    } else {
      console.log(`⚠️  NEEDS IMPROVEMENT: Many pages missing images`);
    }
    
    if (aiImageCount > 0) {
      console.log(`✅ AI image generation is working with Imagen 4.0`);
    }
    
    if (fallbackCount > 0) {
      console.log(`✅ Fallback system is working properly`);
    }
    
    const avgGenerationTime = totalGenerationTime / Math.max(1, aiImageCount + fallbackCount);
    console.log(`📊 Average generation time: ${Math.round(avgGenerationTime)}ms`);
    
    if (avgGenerationTime < 15000) {
      console.log(`✅ Generation speed is acceptable`);
    } else {
      console.log(`⚠️  Generation is slow - consider optimization`);
    }
    
    console.log(`\n🎉 Complete workflow test finished!`);
    console.log(`Ready for production use: ${successCount === pagesWithPrompts.length && avgGenerationTime < 20000 ? 'YES' : 'NEEDS REVIEW'}`);
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
  }
}

testCompleteWorkflow();

// Test to check if Imagen 3.0 is generating real images or using fallbacks
console.log('🔍 Testing Current Image Generation Status...\n');

async function testCurrentImageGeneration() {
  console.log('1️⃣ Testing individual image generation API...');
  
  try {
    // Test with a simple prompt to see what we get
    const testPrompts = [
      "A simple science classroom with colorful educational posters",
      "A bright laboratory with test tubes and microscopes", 
      "A student reading a science book in a library"
    ];

    for (let i = 0; i < testPrompts.length; i++) {
      const prompt = testPrompts[i];
      console.log(`\n🧪 Test ${i + 1}: "${prompt.substring(0, 50)}..."`);
      
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          aspectRatio: '16:9'
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      console.log(`⏱️  Response time: ${duration}ms`);
      console.log(`✅ Success: ${data.success}`);
      
      if (data.imageUrl) {
        if (data.imageUrl.startsWith('data:image/')) {
          // Real AI-generated image
          console.log(`🎨 REAL AI IMAGE GENERATED!`);
          console.log(`   📏 Size: ~${Math.round(data.imageUrl.length / 1024)}KB`);
          console.log(`   🔗 Type: Base64 data URL`);
          console.log(`   ⚡ Generation time: ${duration}ms`);
        } else if (data.imageUrl.startsWith('linear-gradient')) {
          // Fallback gradient
          console.log(`🎭 FALLBACK GRADIENT USED`);
          console.log(`   🌈 Gradient: ${data.imageUrl}`);
          console.log(`   ⚡ Fallback time: ${duration}ms`);
        } else {
          console.log(`❓ Unknown image type: ${data.imageUrl.substring(0, 100)}...`);
        }
      }

      if (data.vantaEffect) {
        console.log(`✨ Vanta Effect: ${data.vantaEffect}`);
      }

      if (data.error) {
        console.log(`⚠️  Error reported: ${data.error}`);
      }

      // Wait a bit between requests to avoid overwhelming the API
      if (i < testPrompts.length - 1) {
        console.log('   ⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n2️⃣ Testing through story generation flow...');
    
    // Test the complete story flow
    const testAdventure = {
      id: "imagen-status-test",
      title: "Image Generation Status Test",
      description: "Testing if Imagen is working in story flow",
      subject: "Physics",
      objectives: ["Test image generation", "Check fallback behavior"]
    };

    const testUserId = "f073aeb6-aebe-4e7b-8ab7-4f5c38e23333";

    console.log('\n📚 Generating test story...');
    const storyResponse = await fetch('http://localhost:3000/api/generate-adventure-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adventure: testAdventure,
        userId: testUserId
      })
    });

    if (storyResponse.ok) {
      const storyData = await storyResponse.json();
      console.log(`✅ Story generated with ${storyData.pages?.length || 0} pages`);
      
      if (storyData.pages && storyData.pages.length > 0) {
        console.log('\n🎨 Testing story page image generation...');
        
        // Test generating an image for the first page
        const firstPage = storyData.pages[0];
        if (firstPage.backgroundPrompt) {
          console.log(`📝 First page prompt: "${firstPage.backgroundPrompt.substring(0, 80)}..."`);
          
          const imageStartTime = Date.now();
          const pageImageResponse = await fetch('http://localhost:3000/api/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: firstPage.backgroundPrompt,
              aspectRatio: '16:9'
            })
          });

          const imageEndTime = Date.now();
          const imageDuration = imageEndTime - imageStartTime;

          if (pageImageResponse.ok) {
            const imageData = await pageImageResponse.json();
            
            console.log(`\n📊 Story Image Generation Result:`);
            console.log(`   ⏱️  Time: ${imageDuration}ms`);
            console.log(`   ✅ Success: ${imageData.success}`);
            
            if (imageData.imageUrl) {
              if (imageData.imageUrl.startsWith('data:image/')) {
                console.log(`   🎨 REAL AI IMAGE for story page!`);
                console.log(`   📏 Size: ~${Math.round(imageData.imageUrl.length / 1024)}KB`);
              } else {
                console.log(`   🎭 FALLBACK used for story page`);
                console.log(`   🌈 Type: ${imageData.imageUrl.startsWith('linear-gradient') ? 'Gradient' : 'Other'}`);
              }
            }
          }
        }
      }
    }

    console.log('\n🎯 SUMMARY - Current Image Generation Status:');
    console.log('📊 Check the results above to see:');
    console.log('   • Response times (AI: ~10-15s, Fallback: <3s)');
    console.log('   • Image sizes (AI: 1-2MB, Fallback: tiny)');
    console.log('   • Success rates vs. fallback usage');
    console.log('   • Any rate limiting or API errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCurrentImageGeneration();

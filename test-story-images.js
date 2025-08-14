// Simple test to manually trigger story generation and see image creation
const testAdventure = {
  id: "test-adventure-123",
  title: "Test Science Adventure",
  description: "Testing image generation for story pages",
  subject: "Chemistry",
  objectives: ["Test background image generation", "Verify story flow"]
};

const testUserId = "f073aeb6-aebe-4e7b-8ab7-4f5c38e23333"; // Use real user ID from logs

async function testStoryImageGeneration() {
  console.log('🧪 Testing Story with Image Generation...');
  
  try {
    console.log('📚 Generating story...');
    
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
    
    console.log('✅ Story generated successfully!');
    console.log(`📖 Title: ${storyData.title}`);
    console.log(`📄 Pages: ${storyData.pages?.length || 0}`);
    
    if (storyData.pages) {
      console.log('\n📝 Page Analysis:');
      storyData.pages.forEach((page, index) => {
        console.log(`\n   Page ${index + 1}: ${page.title || page.id}`);
        console.log(`   • Has content: ${!!page.content}`);
        console.log(`   • Has background prompt: ${!!page.backgroundPrompt}`);
        console.log(`   • Has background image: ${!!page.backgroundImage}`);
        
        if (page.backgroundPrompt) {
          console.log(`   • Prompt preview: "${page.backgroundPrompt.substring(0, 100)}..."`);
        }
      });
      
      // Test image generation for each page
      console.log('\n🎨 Testing individual image generation for each page...');
      
      for (let i = 0; i < storyData.pages.length; i++) {
        const page = storyData.pages[i];
        
        if (page.backgroundPrompt) {
          console.log(`\n   🖼️  Generating image for page ${i + 1}...`);
          
          try {
            const imageResponse = await fetch('http://localhost:3000/api/generate-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: page.backgroundPrompt,
                aspectRatio: '16:9'
              })
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              console.log(`   📊 Image response for page ${i + 1}:`, {
                success: imageData.success,
                hasImageUrl: !!imageData.imageUrl,
                imageUrlType: imageData.imageUrl ? (imageData.imageUrl.startsWith('data:') ? 'base64' : 'url') : 'none',
                imageUrlPreview: imageData.imageUrl ? imageData.imageUrl.substring(0, 100) + '...' : 'none'
              });
              
              if (imageData.success && imageData.imageUrl) {
                console.log(`   ✅ Image generated for page ${i + 1}`);
                if (imageData.imageUrl.startsWith('data:')) {
                  console.log(`   📏 Image size: ~${Math.round(imageData.imageUrl.length / 1024)}KB`);
                } else {
                  console.log(`   🔗 Image URL: ${imageData.imageUrl}`);
                }
              } else {
                console.log(`   ❌ Image generation failed for page ${i + 1}`);
              }
            } else {
              console.log(`   ❌ Image API request failed for page ${i + 1}: ${imageResponse.status}`);
            }
          } catch (error) {
            console.log(`   ❌ Error generating image for page ${i + 1}:`, error.message);
          }
        } else {
          console.log(`   ⚠️  Page ${i + 1} has no background prompt`);
        }
      }
    }

    console.log('\n🎉 Story and Image Generation Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   • Story pages created: ${storyData.pages?.length || 0}`);
    console.log(`   • Pages with prompts: ${storyData.pages?.filter(p => p.backgroundPrompt).length || 0}`);
    console.log(`   • Background image generation tested individually`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStoryImageGeneration();

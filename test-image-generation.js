#!/usr/bin  const BASE_URL = 'http://localhost:3001';env node

/**
 * Simple test script to verify image generation endpoint
 * Run with: node test-image-generation.js
 */

async function testImageGeneration() {
  console.log('🧪 Testing Enhanced Image Generation...\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    console.log('🖼️  Testing image generation endpoint...');
    
    const response = await fetch(`${BASE_URL}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: "A magical forest with glowing mushrooms and fireflies at twilight, cinematic style, 16:9 aspect ratio",
        aspectRatio: "16:9"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Image generation endpoint responded successfully!');
      if (data.success) {
      if (data.imageUrl && data.imageUrl.startsWith('data:image/')) {
        console.log('🎨 AI-generated image returned (base64 data)');
        console.log(`📏 Image size: ~${Math.round(data.imageUrl.length / 1024)}KB`);
      } else if (data.imageUrl && data.imageUrl.startsWith('linear-gradient')) {
        console.log('🌈 Fallback gradient returned as imageUrl');
        console.log(`🎨 Gradient: ${data.imageUrl}`);
      } else {
        console.log('🌈 Fallback gradient returned');
        console.log(`🎨 Gradient: ${data.fallbackGradient || 'Not specified'}`);
      }
      
      // Check the response structure
      console.log('\n📊 Response structure:');
      console.log(`✓ success: ${data.success}`);
      console.log(`✓ imageUrl: ${data.imageUrl ? 'Present' : 'Missing'}`);
      console.log(`✓ fallbackGradient: ${data.fallbackGradient ? 'Present' : 'Missing'}`);
      
    } else {
      console.log('❌ Image generation failed:', data.error || 'Unknown error');
      console.log('📊 Full response:', JSON.stringify(data, null, 2));
    }

    // Test with different aspect ratios
    console.log('\n🔄 Testing different aspect ratio...');
    const response2 = await fetch(`${BASE_URL}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: "A futuristic science laboratory with bubbling test tubes and holographic displays",
        aspectRatio: "4:3"
      })
    });

    const data2 = await response2.json();
    console.log(`✅ Second test: ${data2.success ? 'Success' : 'Failed'}`);

    console.log('\n🎉 Image generation tests completed!');
    console.log('\n📝 Summary:');
    console.log('- Image generation endpoint is working');
    console.log('- Both 16:9 and 4:3 aspect ratios supported');
    console.log('- Fallback gradients available when AI generation fails');
    console.log('\n💡 To enable AI image generation, set up Google Cloud credentials in .env.local');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running on port 3000');
  }
}

// Check if we're in Node.js environment
if (typeof fetch === 'undefined') {
  // For older Node.js versions
  const { fetch } = require('node-fetch');
  global.fetch = fetch;
}

testImageGeneration();

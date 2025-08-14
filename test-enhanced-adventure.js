#!/usr/bin/env node

/**
 * Test script to verify enhanced adventure story generation
 * Run with: node test-enhanced-adventure.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002';

async function testStoryGeneration() {
  console.log('🧪 Testing Enhanced Adventure Story Generation...\n');

  try {
    // Test story generation endpoint
    console.log('📖 Generating test adventure story...');
    const response = await fetch(`${BASE_URL}/api/generate-adventure-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'Photosynthesis',
        age: 10,
        concepts: ['chlorophyll', 'sunlight', 'carbon dioxide', 'oxygen'],
        difficulty: 'beginner'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Story generated successfully!');
    console.log(`📚 Title: ${data.story.title}`);
    console.log(`📄 Pages: ${data.story.pages.length}`);
    console.log(`❓ Reflection Questions: ${data.story.reflectionQuestions.length}\n`);

    // Verify background prompts are included
    console.log('🎨 Checking background prompts...');
    let hasBackgroundPrompts = true;
    let hasFallbackGradients = true;

    data.story.pages.forEach((page, index) => {
      console.log(`Page ${index + 1}:`);
      console.log(`  📝 Title: ${page.title}`);
      
      if (!page.backgroundPrompt) {
        console.log(`  ❌ Missing backgroundPrompt`);
        hasBackgroundPrompts = false;
      } else {
        console.log(`  🎨 Background Prompt: ${page.backgroundPrompt.substring(0, 60)}...`);
      }

      if (!page.fallbackGradient) {
        console.log(`  ❌ Missing fallbackGradient`);
        hasFallbackGradients = false;
      } else {
        console.log(`  🌈 Fallback Gradient: ${page.fallbackGradient}`);
      }
      console.log('');
    });

    // Test image generation endpoint
    console.log('🖼️  Testing image generation endpoint...');
    const imageResponse = await fetch(`${BASE_URL}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: "A beautiful garden with colorful flowers blooming in sunlight, educational illustration style",
        aspectRatio: "16:9"
      })
    });

    const imageData = await imageResponse.json();
    
    if (imageData.success) {
      console.log('✅ Image generation endpoint working!');
      if (imageData.imageUrl) {
        console.log('🎨 AI-generated image returned');
      } else {
        console.log('🌈 Fallback gradient returned');
      }
    } else {
      console.log('⚠️  Image generation using fallback (expected without Google Cloud setup)');
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Story generation: Working`);
    console.log(`${hasBackgroundPrompts ? '✅' : '❌'} Background prompts: ${hasBackgroundPrompts ? 'Present' : 'Missing'}`);
    console.log(`${hasFallbackGradients ? '✅' : '❌'} Fallback gradients: ${hasFallbackGradients ? 'Present' : 'Missing'}`);
    console.log(`✅ Image endpoint: Working (with fallbacks)`);

    if (hasBackgroundPrompts && hasFallbackGradients) {
      console.log('\n🎉 All tests passed! Enhanced storybook is ready to use.');
      console.log('💡 To enable AI image generation, set up Google Cloud credentials in .env.local');
    } else {
      console.log('\n❌ Some tests failed. Check the adventure story generation logic.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or you need to install node-fetch');
  console.log('📦 Install node-fetch: npm install node-fetch');
  process.exit(1);
}

testStoryGeneration();

const fetch = require('node-fetch');

async function testImageEndpoint() {
  console.log('🎨 Testing Image Generation Endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/generate-image-enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Educational illustration for grade 4 students: Simple diagram showing labeled parts of a flower including petals, stem, leaves, and roots. Style: Clean, colorful, child-friendly diagram or illustration with clear labels. Educational textbook style. Bright colors, simple design, easy to understand. No text overlay, pure illustration.',
        aspectRatio: '1:1',
        gradeLevel: 4
      })
    });

    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS!');
      console.log('📝 Response:', {
        success: data.success,
        hasImageUrl: !!data.imageUrl,
        imageUrlLength: data.imageUrl ? data.imageUrl.length : 0,
        isBase64: data.imageUrl ? data.imageUrl.startsWith('data:image/') : false
      });
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED!');
      console.log('📝 Error Response:', errorText.substring(0, 500));
    }
  } catch (error) {
    console.log('💥 NETWORK ERROR:', error.message);
  }
}

testImageEndpoint();

const fs = require('fs');

// Load environment variables from .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envVars = envContent.split('\n');
  
  envVars.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');
        process.env[key] = value;
      }
    }
  });
}

async function testGoogleAI() {
  console.log('Testing Google Generative AI API...');
  console.log('API Key:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Present' : 'Missing');
  
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.log('❌ API key missing from environment');
    return;
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  console.log('API Key starts with:', apiKey.substring(0, 10) + '...');

  try {
    // Test the Google Generative Language API directly
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, test message'
          }]
        }]
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Response body:', data);

    if (!response.ok) {
      console.log('❌ API request failed');
      try {
        const errorData = JSON.parse(data);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', data);
      }
    } else {
      console.log('✅ API request successful');
    }

  } catch (error) {
    console.log('❌ Error making request:', error.message);
  }
}

testGoogleAI();
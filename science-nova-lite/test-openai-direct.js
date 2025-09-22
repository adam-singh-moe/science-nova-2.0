// Direct OpenAI API test to isolate the issue
require('dotenv').config({ path: '.env.local' });

async function testOpenAIDirectly() {
    console.log('=== DIRECT OPENAI API TEST ===');
    
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length);
    console.log('API Key starts with sk-proj:', apiKey?.startsWith('sk-proj-'));
    console.log('API Key first 20 chars:', apiKey?.substring(0, 20));
    console.log('API Key last 20 chars:', apiKey?.substring(apiKey.length - 20));
    
    if (!apiKey) {
        console.log('❌ No API key found');
        return;
    }
    
    try {
        console.log('\n=== TESTING OPENAI API DIRECTLY ===');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Say "Hello from direct API test"' }],
                max_tokens: 50
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('✅ Direct OpenAI API test successful!');
        } else {
            console.log('❌ Direct OpenAI API test failed');
        }
        
    } catch (error) {
        console.error('❌ Direct API test error:', error.message);
    }
}

testOpenAIDirectly();
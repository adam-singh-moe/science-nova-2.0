// Test Google AI fallback system
require('dotenv').config({ path: '.env.local' });

async function testGoogleAI() {
    console.log('=== GOOGLE AI FALLBACK TEST ===');
    
    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    console.log('Google AI Key exists:', !!googleKey);
    console.log('Google AI Key length:', googleKey?.length);
    console.log('Google AI Key first 20 chars:', googleKey?.substring(0, 20));
    
    if (!googleKey) {
        console.log('❌ No Google AI key found');
        return;
    }
    
    try {
        console.log('\n=== TESTING GOOGLE AI DIRECTLY ===');
        
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(googleKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const result = await model.generateContent('Say "Hello from Google AI test"');
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Google AI test successful!');
        console.log('Response:', text);
        
    } catch (error) {
        console.error('❌ Google AI test error:', error.message);
        
        // Try with alternative key
        const altKey = process.env.AI_HELPER_GOOGLE_API_KEY;
        if (altKey && altKey !== googleKey) {
            console.log('\n=== TESTING ALTERNATIVE GOOGLE AI KEY ===');
            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(altKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
                
                const result = await model.generateContent('Say "Hello from Google AI alternative test"');
                const response = await result.response;
                const text = response.text();
                
                console.log('✅ Google AI alternative test successful!');
                console.log('Response:', text);
                
            } catch (error2) {
                console.error('❌ Alternative Google AI test error:', error2.message);
            }
        }
    }
}

testGoogleAI();
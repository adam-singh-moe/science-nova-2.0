// Test the AI system to ensure OpenAI API key is detected
require('dotenv').config({ path: '.env.local' });

// Test environment variables
console.log('Testing Environment Variables...');

console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY starts correctly:', process.env.OPENAI_API_KEY?.startsWith('sk-'));

// Test if the API key looks valid
if (process.env.OPENAI_API_KEY) {
    console.log('✅ OpenAI API key is present in environment');
    console.log('Key length:', process.env.OPENAI_API_KEY.length);
} else {
    console.log('❌ OpenAI API key is missing');
}

async function testAISystem() {
    console.log('Testing AI System...');
    
    try {
        const ai = new SimpleAI();
        console.log('AI instance created');
        
        const status = await ai.getStatus();
        console.log('AI Status:', status);
        
        const isAvailable = await ai.isAvailable();
        console.log('AI Available:', isAvailable);
        
        if (isAvailable) {
            console.log('✅ AI system is working properly!');
            
            // Test a simple generation
            try {
                const response = await ai.generateText('Say "Hello, AI system is working!"');
                console.log('AI Response:', response);
            } catch (error) {
                console.log('Generation test failed:', error.message);
            }
        } else {
            console.log('❌ AI system is not available');
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAISystem();
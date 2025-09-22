// Test status reporting after failures
require('dotenv').config({ path: '.env.local' });

async function testStatusAfterFailures() {
    console.log('=== TESTING STATUS REPORTING AFTER FAILURES ===');
    
    const { SimpleAI } = require('./lib/simple-ai.ts');
    
    try {
        const ai = new SimpleAI();
        
        console.log('\n1. Initial status (before any API calls):');
        const initialStatus = ai.getStatus();
        console.log('Status:', initialStatus);
        
        console.log('\n2. Making a call that will fail...');
        const response = await ai.generateText('test prompt');
        console.log('Response received (fallback):', response.substring(0, 50) + '...');
        
        console.log('\n3. Status after failure:');
        const postFailureStatus = ai.getStatus();
        console.log('Status:', postFailureStatus);
        
        console.log('\n4. isAvailable() after failure:');
        const available = ai.isAvailable();
        console.log('Available:', available);
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testStatusAfterFailures();
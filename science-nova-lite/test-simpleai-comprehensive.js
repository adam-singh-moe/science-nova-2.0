// Comprehensive test of the actual SimpleAI system
require('dotenv').config({ path: '.env.local' });

async function testSimpleAISystem() {
    console.log('=== SIMPLEAI SYSTEM COMPREHENSIVE TEST ===');
    
    // Import the SimpleAI class - using require since it's CommonJS
    const { SimpleAI, generateEducationalContent } = require('./lib/simple-ai.ts');
    
    try {
        console.log('\n1. Testing SimpleAI instantiation...');
        const ai = new SimpleAI();
        
        console.log('\n2. Testing getStatus()...');
        const status = ai.getStatus();
        console.log('Status:', status);
        
        console.log('\n3. Testing isAvailable()...');
        const available = ai.isAvailable();
        console.log('Available:', available);
        
        console.log('\n4. Testing generateText() with simple prompt...');
        const simpleResponse = await ai.generateText('Say hello');
        console.log('Simple response length:', simpleResponse.length);
        console.log('Simple response:', simpleResponse.substring(0, 200) + '...');
        
        console.log('\n5. Testing generateText() with flashcard prompt...');
        const flashcardPrompt = 'Create flashcards about photosynthesis for grade 5';
        const flashcardResponse = await ai.generateText(flashcardPrompt);
        console.log('Flashcard response length:', flashcardResponse.length);
        console.log('Is JSON format:', flashcardResponse.includes('"flashcards"'));
        
        console.log('\n6. Testing generateEducationalContent()...');
        const eduContent = await generateEducationalContent('Solar System', 6, { type: 'lesson' });
        console.log('Educational content keys:', Object.keys(eduContent));
        console.log('Has lessonContent:', !!eduContent.lessonContent);
        console.log('Has flashcards:', !!eduContent.flashcards);
        console.log('Has quiz:', !!eduContent.quiz);
        
        console.log('\n7. Testing discovery content...');
        const discoveryContent = await generateEducationalContent('Ocean Animals', 4, { type: 'discovery', count: 3 });
        console.log('Discovery content keys:', Object.keys(discoveryContent));
        console.log('Facts count:', discoveryContent.facts?.length || 0);
        
        console.log('\n✅ SimpleAI system test completed successfully!');
        
    } catch (error) {
        console.error('❌ SimpleAI system test failed:', error.message);
        console.error('Error details:', error);
    }
}

testSimpleAISystem();
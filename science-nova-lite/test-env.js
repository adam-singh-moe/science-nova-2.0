// Test script to check environment variables
console.log('Environment test:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY value:', process.env.OPENAI_API_KEY ? 'Found (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'Not found');
console.log('GOOGLE_GENERATIVE_AI_API_KEY exists:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env keys containing AI:', Object.keys(process.env).filter(key => key.includes('AI')));
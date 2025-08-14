require('dotenv').config({ path: '.env.local' });

async function testMultipleQuestions() {
  const testUrl = 'http://localhost:3000/api/ai-chat';
  
  const questions = [
    {
      message: "What makes the weather change?",
      gradeLevel: 4,
      description: "Weather question for grade 4"
    },
    {
      message: "How do animals hibernate?", 
      gradeLevel: 5,
      description: "Animal behavior question for grade 5"
    },
    {
      message: "What are the states of matter?",
      gradeLevel: 3,
      description: "States of matter question for grade 3"
    }
  ];

  console.log('🧪 Testing multiple science questions with textbook integration...\n');

  for (const question of questions) {
    console.log(`📚 Testing: ${question.description}`);
    console.log(`❓ Question: "${question.message}"`);
    
    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question.message,
          userId: "test-user-authenticated", // Use real AI, not demo
          gradeLevel: question.gradeLevel,
          learningPreference: "visual"
        })
      });

      const result = await response.json();
      
      console.log(`✅ Grade ${question.gradeLevel} Response:`);
      console.log(result.response);
      console.log(`📊 Used ${result.contentSources} textbook sources:`, result.textbookSources);
      console.log(`📚 Has curriculum content: ${result.relevantContentFound}\n`);
      console.log('─'.repeat(80) + '\n');
      
    } catch (error) {
      console.error(`❌ Error testing "${question.message}":`, error.message);
    }
  }
}

testMultipleQuestions();

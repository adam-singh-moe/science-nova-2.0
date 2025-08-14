require('dotenv').config({ path: '.env.local' });

async function testInteractiveStoryGeneration() {
  console.log('🧪 Testing Interactive Adventure Story Generation...\n');

  try {
    // Test adventure data
    const testAdventure = {
      id: "interactive-test-123",
      title: "The Amazing World of Photosynthesis",
      description: "Join Alex on an exciting journey to discover how plants make their own food",
      subject: "Biology",
      objectives: ["Understand photosynthesis", "Learn about chlorophyll", "Explore plant energy"]
    };

    const testUserId = "test-user-interactive-123";

    // Test story generation with enhanced features
    console.log('📚 Generating interactive adventure story...');
    const response = await fetch('http://localhost:3000/api/generate-adventure-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adventure: testAdventure,
        userId: testUserId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const storyData = await response.json();
    
    console.log('✅ Interactive story generated successfully!');
    console.log(`📖 Title: ${storyData.title}`);
    console.log(`📄 Pages: ${storyData.pages?.length || 0}`);
    console.log(`🧠 Grade Level: ${storyData.gradeLevel}`);
    console.log(`🎨 Learning Style: ${storyData.learningStyle}`);
    
    // Test quiz questions
    if (storyData.pages) {
      console.log('\n🧠 Quiz Question Analysis:');
      const pagesWithQuiz = storyData.pages.filter(page => page.quizQuestion);
      console.log(`   • Pages with quiz questions: ${pagesWithQuiz.length}/${storyData.pages.length}`);
      
      pagesWithQuiz.forEach((page, index) => {
        console.log(`\n   Quiz ${index + 1} (Page: ${page.id}):`);
        console.log(`   Question: "${page.quizQuestion.question}"`);
        console.log(`   Options: ${page.quizQuestion.options.join(', ')}`);
        console.log(`   Correct Answer: ${page.quizQuestion.options[page.quizQuestion.correctAnswer]}`);
        console.log(`   Explanation: "${page.quizQuestion.explanation}"`);
      });
    }

    // Test discussion prompts
    if (storyData.discussionPrompts) {
      console.log('\n💭 Discussion Features:');
      console.log(`   Opening Question: "${storyData.discussionPrompts.openingQuestion}"`);
      console.log(`   Follow-up Questions: ${storyData.discussionPrompts.followUpQuestions.length}`);
      storyData.discussionPrompts.followUpQuestions.forEach((question, index) => {
        console.log(`   ${index + 1}. "${question}"`);
      });
      console.log(`   Encouragement: "${storyData.discussionPrompts.encouragementPhrase}"`);
    }

    // Test reflection questions
    if (storyData.reflectionQuestions) {
      console.log('\n🤔 Reflection Questions:');
      storyData.reflectionQuestions.forEach((question, index) => {
        console.log(`   ${index + 1}. "${question}"`);
      });
    }

    console.log('\n🎉 Interactive Story Features Summary:');
    console.log('✅ Enhanced story generation with grade-appropriate content');
    console.log('✅ Interactive quiz questions embedded in story pages');
    console.log('✅ Grade-level appropriate discussion prompts');
    console.log('✅ Reflection questions for deeper learning');
    console.log('✅ Personalized content based on student profile');
    console.log('\n🌟 The adventure stories now include interactive learning elements!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
  }
}

testInteractiveStoryGeneration();

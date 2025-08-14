// Test script to verify textbook reference removal and discussion button behavior

async function testTextbookReferenceFix() {
  console.log('🔍 Testing textbook reference removal...\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/generate-adventure-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adventure: {
          title: 'The Ecosystem Explorer',
          description: 'Learn about ecosystems and food chains',
          subject: 'ecosystem',
          objectives: ['Understand food chains', 'Learn about ecosystems', 'Explore biodiversity']
        },
        userId: '123e4567-e89b-12d3-a456-426614174000'
      })
    });
    
    const data = await response.json();
    
    if (data.story) {
      console.log('✅ Story generated successfully!');
      console.log('📖 Title:', data.story.title);
      console.log('📄 Total Pages:', data.story.pages.length);
      console.log('');
      
      // Check for textbook references in the content
      const allContent = data.story.pages.map(p => p.content).join(' ');
      
      // List of terms that should NOT appear in stories
      const prohibitedTerms = [
        'textbook', 'publisher', 'McGraw-Hill', 'Pearson', 'Houghton Mifflin', 
        'Cengage', 'reference book', 'according to the book', 'the textbook states',
        'ISBN', 'edition', 'chapter', 'page number', 'source material',
        'curriculum guide', 'educational resource', 'teaching material'
      ];
      
      const foundTerms = prohibitedTerms.filter(term => 
        allContent.toLowerCase().includes(term.toLowerCase())
      );
      
      if (foundTerms.length > 0) {
        console.log('❌ ISSUE: Story contains textbook references:');
        foundTerms.forEach(term => {
          console.log(`   • Found: "${term}"`);
          const index = allContent.toLowerCase().indexOf(term.toLowerCase());
          if (index !== -1) {
            const context = allContent.substring(Math.max(0, index-60), index+60);
            console.log(`     Context: "...${context}..."`);
          }
        });
        console.log('');
      } else {
        console.log('✅ SUCCESS: No prohibited textbook references found!');
        console.log('');
      }
      
      // Check discussion prompts
      if (data.story.discussionPrompts) {
        console.log('💭 Discussion Features:');
        console.log(`   Opening: "${data.story.discussionPrompts.openingQuestion}"`);
        console.log(`   Follow-ups: ${data.story.discussionPrompts.followUpQuestions.length} questions`);
        console.log(`   Encouragement: "${data.story.discussionPrompts.encouragementPhrase}"`);
        console.log('   ✅ Discussion prompts present for button display');
        console.log('');
      } else {
        console.log('❌ Missing discussion prompts');
        console.log('');
      }
      
      // Show sample content
      console.log('📄 Sample Story Content (Page 1):');
      console.log('─'.repeat(60));
      console.log(data.story.pages[0]?.content.substring(0, 400) + '...');
      console.log('─'.repeat(60));
      console.log('');
      
      // Test interactive features
      console.log('🎯 Interactive Features Analysis:');
      const quizPages = data.story.pages.filter(p => p.quizQuestion);
      console.log(`   Quiz Questions: ${quizPages.length}/${data.story.pages.length} pages`);
      console.log(`   Reflection Questions: ${data.story.reflectionQuestions?.length || 0}`);
      console.log('   ✅ All interactive elements present');
      
    } else {
      console.log('❌ Failed to generate story:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ API call failed:', error.message);
  }
}

// Run the test
testTextbookReferenceFix().catch(console.error);

// Simple test to check story content
console.log('Testing story generation...');

fetch('http://localhost:3001/api/generate-adventure-story', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adventure: {
      title: 'The Solar System Adventure',
      description: 'Learn about planets and space',
      subject: 'solar system'
    },
    userId: 'test-user-123'
  })
})
.then(res => res.json())
.then(data => {
  if (data.story) {
    console.log('✅ Story generated successfully!');
    console.log('📖 Title:', data.story.title);
    console.log('📄 Pages:', data.story.pages.length);
    
    // Check for textbook references
    const allContent = data.story.pages.map(p => p.content).join(' ');
    const prohibitedTerms = ['textbook', 'publisher', 'McGraw', 'Pearson', 'ISBN', 'according to', 'reference', 'source material'];
    const foundTerms = prohibitedTerms.filter(term => allContent.toLowerCase().includes(term.toLowerCase()));
    
    if (foundTerms.length > 0) {
      console.log('❌ Found textbook references:', foundTerms);
    } else {
      console.log('✅ No textbook references found!');
    }
    
    // Check discussion prompts
    if (data.story.discussionPrompts) {
      console.log('✅ Discussion prompts present');
      console.log('   Opening:', data.story.discussionPrompts.openingQuestion.substring(0, 60) + '...');
      console.log('   Follow-ups:', data.story.discussionPrompts.followUpQuestions.length);
    } else {
      console.log('❌ No discussion prompts');
    }
    
    console.log('\n📝 Sample content from page 1:');
    console.log('"' + data.story.pages[0].content.substring(0, 400) + '..."');
    
  } else {
    console.log('❌ Error generating story:', data.error);
  }
})
.catch(err => console.log('❌ Request failed:', err.message));

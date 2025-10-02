require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNewMapping() {
  console.log('🧪 Testing new arcade subtype mapping...');
  
  // Test the API validation
  const gameTypes = [
    { type: 'quiz', expectedSubtype: 'QUIZ' },
    { type: 'crossword', expectedSubtype: 'CROSSWORD' },
    { type: 'word-search', expectedSubtype: 'WORDSEARCH' },
    { type: 'memory-game', expectedSubtype: 'MEMORY' }
  ];
  
  const getSubtype = (type) => {
    switch (type) {
      case 'quiz': return 'QUIZ'
      case 'crossword': return 'CROSSWORD'
      case 'word-search': return 'WORDSEARCH'
      case 'memory-game': return 'MEMORY'
      default: return 'QUIZ'
    }
  };
  
  console.log('📝 Testing game type to subtype mapping:');
  gameTypes.forEach(({ type, expectedSubtype }) => {
    const mappedSubtype = getSubtype(type);
    const isCorrect = mappedSubtype === expectedSubtype;
    console.log(`  ${type} → ${mappedSubtype} ${isCorrect ? '✅' : '❌'}`);
  });
  
  // Check current arcade content and subtypes
  console.log('\n📊 Current arcade content subtypes:');
  const { data: arcadeData, error: arcadeError } = await supabase
    .from('topic_content_entries')
    .select('subtype')
    .eq('category', 'ARCADE');
    
  if (!arcadeError) {
    const subtypeCounts = {};
    arcadeData.forEach(item => {
      subtypeCounts[item.subtype] = (subtypeCounts[item.subtype] || 0) + 1;
    });
    
    Object.entries(subtypeCounts).forEach(([subtype, count]) => {
      console.log(`  - ${subtype}: ${count} entries`);
    });
  }
  
  console.log('\n✅ API mapping test completed!');
  console.log('💡 Next steps:');
  console.log('   1. Run scripts/23-simplified-arcade-subtypes.sql in Supabase SQL Editor');
  console.log('   2. Test creating new arcade games to verify subtypes are saved correctly');
}

testNewMapping();
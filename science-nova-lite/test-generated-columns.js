require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGeneratedColumns() {
  try {
    console.log('🧪 Testing generated columns with recent content...');
    
    const { data: content, error } = await supabase
      .from('topic_content_entries')
      .select('id, title, category, subtype, payload, preview_text, detail_text, source_text, status, grade_level')
      .order('created_at', { ascending: false })
      .limit(8);
      
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('📊 Generated Column Test Results:');
    console.log('=====================================');
    
    content.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title} (${item.category}/${item.subtype}) - Grade ${item.grade_level}`);
      console.log(`   Status: ${item.status}`);
      
      // Show payload structure
      const payloadKeys = Object.keys(item.payload || {});
      console.log(`   Payload: ${payloadKeys.join(', ')}`);
      
      // Show generated columns results
      console.log(`   Preview Text: ${item.preview_text || 'NULL'}`);
      console.log(`   Detail Text: ${item.detail_text ? item.detail_text.substring(0, 100) + '...' : 'NULL'}`);
      console.log(`   Source Text: ${item.source_text || 'NULL'}`);
      
      // Verify the generated columns match expectations for each type
      if (item.category === 'DISCOVERY' && item.subtype === 'FACT') {
        const hasExpectedData = item.payload.fact && item.payload.explanation;
        console.log(`   ✅ Fun Fact Structure: ${hasExpectedData ? 'COMPLETE' : 'INCOMPLETE'}`);
        if (hasExpectedData) {
          console.log(`      Fact: '${item.payload.fact.substring(0, 50)}...'`);
          console.log(`      Explanation: '${item.payload.explanation.substring(0, 50)}...'`);
        }
      } else if (item.category === 'DISCOVERY' && item.subtype === 'INFO') {
        const hasExpectedData = item.payload.sections && item.payload.sections.length > 0;
        console.log(`   ✅ Info Structure: ${hasExpectedData ? 'COMPLETE' : 'INCOMPLETE'}`);
        if (hasExpectedData) {
          console.log(`      Sections: ${item.payload.sections.length}`);
        }
      } else if (item.category === 'ARCADE') {
        let gameData = '';
        if (item.payload.pairs) {
          gameData = `Memory Game (${item.payload.pairs.length} pairs)`;
        } else if (item.payload.questions) {
          gameData = `Quiz (${item.payload.questions.length} questions)`;
        } else if (item.payload.words) {
          gameData = `Word Game (${item.payload.words.length} words)`;
        } else {
          gameData = 'Other Game Type';
        }
        console.log(`   ✅ Game Structure: ${gameData}`);
      }
    });
    
    // Test student-facing content query
    console.log('\n🎓 Testing student-facing content query...');
    const { data: studentContent, error: studentError } = await supabase
      .from('topic_content_entries')
      .select('id, title, category, subtype, preview_text, detail_text, grade_level')
      .eq('status', 'published')
      .gte('grade_level', 1)
      .lte('grade_level', 6)
      .limit(3);
      
    if (studentError) {
      console.error('❌ Student query error:', studentError);
    } else {
      console.log(`📚 Found ${studentContent.length} published content items for students`);
      studentContent.forEach(item => {
        console.log(`  - ${item.title} (Grade ${item.grade_level}): ${item.preview_text || 'No preview'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testGeneratedColumns();
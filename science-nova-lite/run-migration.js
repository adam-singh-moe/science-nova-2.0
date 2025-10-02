require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkContent() {
  try {
    console.log('� Checking current topic_content_entries structure and data...');
    
    // Get current schema information first via a workaround
    const { data: testData, error: testError } = await supabase
      .from('topic_content_entries')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('❌ Test query error:', testError);
      return;
    }
    
    if (testData.length > 0) {
      console.log('📊 Available columns in topic_content_entries:');
      Object.keys(testData[0]).forEach(col => {
        console.log(`  - ${col}`);
      });
    }
    
    // Get sample content
    const { data: content, error: contentError } = await supabase
      .from('topic_content_entries')
      .select('id, title, category, subtype, payload, status, grade_level')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (contentError) {
      console.error('❌ Content check error:', contentError);
    } else {
      console.log('\\n📋 Recent content entries:');
      content.forEach(item => {
        console.log(`  - ${item.title} (${item.category}/${item.subtype}) - Grade ${item.grade_level}`);
        console.log(`    Status: ${item.status}`);
        console.log(`    Payload keys: ${Object.keys(item.payload || {}).join(', ')}`);
        
        // Show actual payload structure for different types
        if (item.category === 'DISCOVERY' && item.subtype === 'FACT') {
          console.log(`    Fun Fact: ${item.payload.fact ? 'YES' : 'NO'}`);  
          console.log(`    Explanation: ${item.payload.explanation ? 'YES' : 'NO'}`);
        } else if (item.category === 'DISCOVERY' && item.subtype === 'INFO') {
          console.log(`    Sections: ${item.payload.sections ? item.payload.sections.length : 0}`);
        } else if (item.category === 'ARCADE') {
          if (item.payload.pairs) {
            console.log(`    Memory pairs: ${item.payload.pairs.length}`);
          } else if (item.payload.questions) {
            console.log(`    Quiz questions: ${item.payload.questions.length}`);
          } else if (item.payload.words) {
            console.log(`    Word game words: ${item.payload.words.length}`);
          }
        }
        console.log('');
      });
    }
    
    // Check if we have the generated columns already
    const { data: schemaTest, error: schemaError } = await supabase
      .from('topic_content_entries')
      .select('id, preview_text, detail_text, source_text')
      .limit(1);
      
    if (schemaError) {
      console.log('📝 Generated columns not yet present - migration needed');
      console.log('   Error:', schemaError.message);
    } else {
      console.log('✅ Generated columns already exist!');
      if (schemaTest.length > 0) {
        console.log('   Sample values:');
        console.log(`   - preview_text: ${schemaTest[0].preview_text || 'NULL'}`);
        console.log(`   - detail_text: ${schemaTest[0].detail_text || 'NULL'}`);
        console.log(`   - source_text: ${schemaTest[0].source_text || 'NULL'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Check error:', error);
  }
}

checkContent();
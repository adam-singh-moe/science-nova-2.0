// Quick script to check textbook content availability
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTextbooks() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Checking textbook content by grade...');
    
    for (let grade = 1; grade <= 6; grade++) {
      const { data, error, count } = await supabase
        .from('textbook_embeddings')
        .select('content, metadata', { count: 'exact' })
        .eq('grade_level', grade)
        .limit(3);
      
      if (error) {
        console.log(`❌ Grade ${grade}: Error - ${error.message}`);
      } else {
        console.log(`📚 Grade ${grade}: ${count || 0} total chunks, showing ${data.length}`);
        if (data.length > 0) {
          console.log(`   Sample: "${data[0].content.substring(0, 150)}..."`);
          console.log(`   Metadata: ${JSON.stringify(data[0].metadata)}`);
        }
        console.log('');
      }
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkTextbooks();

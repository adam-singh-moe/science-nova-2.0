const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkContentTable() {
  console.log('🔍 Checking topic_content_entries table structure\n');
  
  // Get first few rows to see actual column structure
  const { data, error } = await supabase
    .from('topic_content_entries')
    .select('*')
    .limit(2);
    
  if (error) {
    console.log('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Sample row structure:');
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log('\n🏷️ Available columns:');
    Object.keys(data[0]).forEach(col => {
      console.log(`  - ${col}: ${typeof data[0][col]}`);
    });
  } else {
    console.log('❌ No data found in table');
  }
}

checkContentTable().catch(console.error);
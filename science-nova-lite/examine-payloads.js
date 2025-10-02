require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function examinePayloads() {
  const { data: content } = await supabase
    .from('topic_content_entries')
    .select('id, title, category, subtype, payload')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('🔍 Actual payload structures:');
  content.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.title} (${item.category}/${item.subtype})`);
    console.log('   Payload:', JSON.stringify(item.payload, null, 2));
  });
}

examinePayloads();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Exact copy of the stableHash function from lib/hash.ts
function stableHash(input) {
  let h = 0, i = 0, len = input.length
  while (i < len) {
    h = (Math.imul(31, h) + input.charCodeAt(i++)) | 0
  }
  return (h >>> 0)
}

async function checkDailySelections() {
  const date = new Date().toISOString().slice(0,10);
  console.log('Date:', date);
  
  // Get topics with content
  const { data: discoveryRows } = await supabase
    .from('topic_content_entries')
    .select('topic_id')
    .eq('category','DISCOVERY')
    .eq('status','published');
    
  const { data: arcadeRows } = await supabase
    .from('topic_content_entries')
    .select('topic_id')
    .eq('category','ARCADE')
    .eq('status','published');
    
  const discoveryTopics = Array.from(new Set(discoveryRows.map(r => r.topic_id)));
  const arcadeTopics = Array.from(new Set(arcadeRows.map(r => r.topic_id)));
  
  console.log('Discovery topics with content:', discoveryTopics.length);
  console.log('Arcade topics with content:', arcadeTopics.length);
  
  // Test different user IDs
  const testUsers = ['anon', '58ed7802-ff6c-4333-bc52-3a1dc20a58fc', 'Adam Singh'];
  
  for (const userId of testUsers) {
    console.log(`\nUser: ${userId}`);
    
    if (discoveryTopics.length > 0) {
      const discoveryHash = stableHash(`${userId}:DISCOVERY:${date}`);
      const discoveryIndex = discoveryHash % discoveryTopics.length;
      const discoveryTopic = discoveryTopics[discoveryIndex];
      
      const { data: topic } = await supabase.from('topics').select('title').eq('id', discoveryTopic).single();
      console.log(`  Discovery: ${topic?.title} (index ${discoveryIndex})`);
    }
    
    if (arcadeTopics.length > 0) {
      const arcadeHash = stableHash(`${userId}:ARCADE:${date}`);
      const arcadeIndex = arcadeHash % arcadeTopics.length;
      const arcadeTopic = arcadeTopics[arcadeIndex];
      
      const { data: topic } = await supabase.from('topics').select('title').eq('id', arcadeTopic).single();
      console.log(`  Arcade: ${topic?.title} (index ${arcadeIndex})`);
    }
  }
}

checkDailySelections();
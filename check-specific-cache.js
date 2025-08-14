require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCache() {
  try {
    // Check content_cache table
    const { data, error } = await supabase
      .from('content_cache')
      .select('*')
      .eq('topic_id', '8898c8e9-842f-46e4-87a9-413f11a8cbb7');

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Cache entries found:', data?.length || 0);
      if (data && data.length > 0) {
        data.forEach(entry => {
          console.log(`- User ID: ${entry.user_id}`);
          console.log(`- Created: ${entry.created_at}`);
          console.log(`- Content size: ${entry.content?.length || 0} bytes`);
          console.log(`- Has metadata: ${!!entry.generation_metadata}`);
          if (entry.generation_metadata) {
            console.log(`- Cached without images: ${entry.generation_metadata.cached_without_images}`);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCache();

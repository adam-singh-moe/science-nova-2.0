const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCacheStatus() {
  console.log('💾 Checking content cache status...')
  
  try {
    const { data: cacheData, error } = await supabase
      .from('content_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`📚 Found ${cacheData.length} cached items:`);
      cacheData.forEach((item, i) => {
        console.log(`${i+1}. ${item.topic_title} (Grade ${item.grade_level})`);
        console.log(`   User: ${item.user_id || 'N/A'}`);
        console.log(`   Created: ${new Date(item.created_at).toLocaleString()}`);
        console.log(`   Content: ${item.content ? item.content.substring(0, 100) + '...' : 'No content'}`);
        console.log(''); // Empty line for spacing
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkCacheStatus().catch(console.error)

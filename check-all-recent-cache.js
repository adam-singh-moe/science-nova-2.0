const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAllRecentCache() {
  console.log('💾 Checking all recent cache entries...')
  
  try {
    const { data: cacheData, error } = await supabase
      .from('content_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`📚 Found ${cacheData.length} recent cache entries:`);
      cacheData.forEach((item, i) => {
        console.log(`${i+1}. Topic ID: ${item.topic_id}`);
        console.log(`   User: ${item.user_id || 'N/A'}`);
        console.log(`   Created: ${new Date(item.created_at).toLocaleString()}`);
        console.log(`   Content images: ${item.content_images_generated || 0}`);
        console.log(`   Flashcard images: ${item.flashcard_images_generated || 0}`);
        console.log(`   Has content: ${!!item.content}`);
        console.log(''); // Empty line for spacing
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkAllRecentCache().catch(console.error)

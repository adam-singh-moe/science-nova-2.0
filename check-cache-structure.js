const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCacheStructure() {
  console.log('🔍 Checking content cache table structure...')
  
  try {
    const { data: cacheData, error } = await supabase
      .from('content_cache')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else if (cacheData.length > 0) {
      console.log('📝 Table columns:');
      Object.keys(cacheData[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof cacheData[0][column]} = ${cacheData[0][column]}`);
      });
    } else {
      console.log('📭 No cache data found');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkCacheStructure().catch(console.error)

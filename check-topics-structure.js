const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTopicsTable() {
  console.log('📝 Checking topics table structure...')
  
  try {
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`📚 Found ${topics.length} sample topics:`);
      topics.forEach((topic, i) => {
        console.log(`${i+1}. Topic:`, JSON.stringify(topic, null, 2));
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkTopicsTable().catch(console.error)

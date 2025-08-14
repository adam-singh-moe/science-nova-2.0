const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProfilesStructure() {
  console.log('🔍 Checking profiles table structure...')
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else if (profiles.length > 0) {
      console.log('📝 Profiles table columns:');
      Object.keys(profiles[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof profiles[0][column]} = ${profiles[0][column]}`);
      });
    } else {
      console.log('📭 No profile data found');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkProfilesStructure().catch(console.error)

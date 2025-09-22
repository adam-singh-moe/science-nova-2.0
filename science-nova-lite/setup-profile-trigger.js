const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.log('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupProfileTrigger() {
  console.log('🔧 Setting up automatic profile creation trigger...')
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'scripts', 'create-profile-trigger.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ Error setting up trigger:', error.message)
      console.log('💡 Please run the SQL script manually in your Supabase SQL editor:')
      console.log('   scripts/create-profile-trigger.sql')
      return
    }
    
    console.log('✅ Profile creation trigger set up successfully!')
    console.log('📝 New users will automatically get a profile with STUDENT role')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.log('💡 Please run the SQL script manually in your Supabase SQL editor:')
    console.log('   scripts/create-profile-trigger.sql')
  }
}

setupProfileTrigger()

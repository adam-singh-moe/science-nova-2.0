const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listDatabaseFunctions() {
  console.log('🔍 Checking database functions...')
  
  try {
    // Let's try to call the function with minimal parameters to see the exact error
    console.log('Testing get_recommended_topics function...')
    const { data, error: funcError } = await supabase
      .rpc('get_recommended_topics', { 
        user_id: '727d3042-fc6e-4d2c-af7b-a6343a2189a6', 
        limit_count: 3 
      })

    if (funcError) {
      console.log('❌ Function error details:')
      console.log('Code:', funcError.code)
      console.log('Message:', funcError.message)
      console.log('Details:', funcError.details)
      console.log('Hint:', funcError.hint)
    } else {
      console.log('✅ Function works:', data)
    }

  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

listDatabaseFunctions().catch(console.error)

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTableSchema() {
  try {
    console.log('🔍 Checking textbook_embeddings table schema...')
    
    // Check current schema
    const { data, error } = await supabase
      .from('textbook_embeddings')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error checking schema:', error.message)
      return
    }
    
    if (data.length > 0) {
      console.log('✅ Current schema columns:', Object.keys(data[0]))
    } else {
      console.log('📋 Table exists but is empty')
    }
    
    // Try to get table structure directly (PostgreSQL specific)
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'textbook_embeddings' })
    
    if (columnsError) {
      console.log('ℹ️  Could not get detailed column info:', columnsError.message)
    } else {
      console.log('📊 Table columns:', columns)
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
  }
}

checkTableSchema()
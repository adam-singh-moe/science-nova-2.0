require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function listTables() {
  try {
    // Get table names using a PostgreSQL specific query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    })
    
    if (error) {
      console.log('Trying alternative method...')
      // Try direct query method
      const tables = [
        'topics', 
        'study_areas', 
        'textbook_uploads', 
        'textbook_chunks',
        'user_progress',
        'conversation_history',
        'profiles',
        'topic_study_areas'
      ]
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)
          
          if (!error) {
            console.log(`✅ Table exists: ${table}`)
          }
        } catch (e) {
          console.log(`❌ Table not found: ${table}`)
        }
      }
    } else {
      console.log('📋 Available tables:')
      data?.forEach(row => {
        console.log(`  - ${row.table_name}`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

listTables()

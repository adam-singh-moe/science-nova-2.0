// Check what the content_cache table actually needs based on usage
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeContentCacheUsage() {
  try {
    console.log('🔍 Analyzing content_cache table needs...')
    
    // Check current table structure
    const { data: currentData, error: currentError } = await supabase
      .from('content_cache')
      .select('*')
      .limit(1)
    
    if (currentError) {
      console.error('❌ Error accessing content_cache:', currentError)
      return
    }
    
    console.log('📋 Current table columns:', currentData && currentData.length > 0 ? Object.keys(currentData[0]) : 'Table is empty')
    
    // Based on the API analysis, content_cache needs these columns:
    const expectedColumns = [
      'id',
      'topic_id', 
      'user_id',
      'content',
      'title',           // Used in content-engagement API
      'content_type',    // Used in content-engagement API (ARCADE/DISCOVERY)
      'content_subtype', // Used in content-engagement API  
      'status',          // Used in arcade API
      'category',        // Used in arcade API
      'subtype',         // Used in arcade API
      'created_at',
      'updated_at'
    ]
    
    console.log('\n📊 Expected columns based on API usage:')
    expectedColumns.forEach(col => console.log(`  - ${col}`))
    
    console.log('\n🔧 Missing columns that need to be added:')
    const currentColumns = currentData && currentData.length > 0 ? Object.keys(currentData[0]) : []
    const missingColumns = expectedColumns.filter(col => !currentColumns.includes(col))
    
    if (missingColumns.length === 0) {
      console.log('✅ No missing columns!')
    } else {
      missingColumns.forEach(col => console.log(`  ❌ ${col}`))
      
      console.log('\n📝 SQL to add missing columns:')
      console.log('```sql')
      console.log('-- Add missing columns to content_cache table')
      missingColumns.forEach(col => {
        let columnDef = ''
        switch(col) {
          case 'title':
            columnDef = 'ALTER TABLE content_cache ADD COLUMN title TEXT;'
            break
          case 'content_type':
            columnDef = 'ALTER TABLE content_cache ADD COLUMN content_type TEXT;'
            break
          case 'content_subtype':
            columnDef = 'ALTER TABLE content_cache ADD COLUMN content_subtype TEXT;'
            break
          case 'status':
            columnDef = 'ALTER TABLE content_cache ADD COLUMN status TEXT DEFAULT \'published\';'
            break
          case 'category':
            columnDef = 'ALTER TABLE content_cache ADD COLUMN category TEXT;'
            break
          case 'subtype':
            columnDef = 'ALTER TABLE content_cache ADD COLUMN subtype TEXT;'
            break
          default:
            columnDef = `ALTER TABLE content_cache ADD COLUMN ${col} TEXT;`
        }
        console.log(columnDef)
      })
      console.log('```')
    }
    
    // Alternative: Check if there's a newer table structure we should be using
    console.log('\n🔍 Checking for alternative table structures...')
    
    // Try to see if there are any content-related tables with the expected structure
    const tables = ['content_entries', 'arcade_content', 'discovery_content', 'cached_content']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (!error && data) {
          console.log(`✅ Found ${table} with columns:`, Object.keys(data[0] || {}))
        }
      } catch (e) {
        // Table doesn't exist, that's fine
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

analyzeContentCacheUsage()
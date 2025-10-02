const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabase() {
  console.log('🔍 Debugging database connection and schema...\n')

  try {
    // Test connection
    console.log('1. Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message)
      return
    }
    console.log('✅ Connection successful\n')

    // Check if topic_content_entries table exists
    console.log('2. Checking topic_content_entries table...')
    const { data: tableData, error: tableError } = await supabase
      .from('topic_content_entries')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError.message)
      console.log('This suggests the table may not exist or has permission issues\n')
      
      // Check if we can see table structure
      console.log('3. Attempting to check table columns...')
      const { data: columnData, error: columnError } = await supabase
        .rpc('exec', { 
          sql: `SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'topic_content_entries' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;`
        })
      
      if (columnError) {
        console.error('❌ Cannot check table structure:', columnError.message)
      } else {
        console.log('📋 Table columns:', columnData)
      }
      return
    }
    
    console.log('✅ Table exists and accessible')
    console.log('📊 Sample data count:', tableData?.length || 0, '\n')

    // Check specific columns we need
    console.log('3. Checking required columns...')
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('topic_content_entries')
      .select('id, topic_id, category, subtype, title, payload, grade_level, status, created_by, created_at')
      .limit(1)
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message)
      console.log('This might indicate missing columns (like grade_level)\n')
      
      // Try without grade_level
      console.log('4. Checking without grade_level column...')
      const { data: basicCheck, error: basicError } = await supabase
        .from('topic_content_entries')
        .select('id, topic_id, category, subtype, title, payload, status, created_by')
        .limit(1)
      
      if (basicError) {
        console.error('❌ Basic schema check failed:', basicError.message)
      } else {
        console.log('✅ Basic columns exist, but grade_level is missing')
        console.log('🔧 You need to run the migration script: scripts/add-grade-level-to-topic-content.sql\n')
      }
    } else {
      console.log('✅ All required columns exist\n')
    }

    // Check existing data
    console.log('4. Checking existing content...')
    const { data: contentData, error: contentError } = await supabase
      .from('topic_content_entries')
      .select('id, category, subtype, grade_level, status')
      .limit(5)
    
    if (!contentError && contentData) {
      console.log('📊 Sample content:', contentData)
    } else if (contentError) {
      console.error('❌ Cannot fetch content:', contentError.message)
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
  }
}

checkDatabase()
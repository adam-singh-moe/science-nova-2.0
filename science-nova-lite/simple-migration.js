// Simple database migration script
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addGradeLevelColumn() {
  try {
    console.log('🚀 Adding grade_level column to topic_content_entries...')
    
    // Add the column with proper constraints
    const alterTableSQL = `
      DO $$ 
      BEGIN
          -- Add grade_level column if it doesn't exist
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'topic_content_entries' 
              AND column_name = 'grade_level'
              AND table_schema = 'public'
          ) THEN
              ALTER TABLE public.topic_content_entries 
              ADD COLUMN grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 6);
              
              RAISE NOTICE 'Added grade_level column to topic_content_entries table';
          ELSE
              RAISE NOTICE 'grade_level column already exists in topic_content_entries table';
          END IF;
      END $$;
    `
    
    // Execute using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: alterTableSQL })
    
    if (error) {
      console.error('❌ Failed to add column:', error)
      
      // Try alternative approach - direct ALTER TABLE
      console.log('🔄 Trying alternative approach...')
      const { error: altError } = await supabase.rpc('sql', { 
        query: 'ALTER TABLE public.topic_content_entries ADD COLUMN IF NOT EXISTS grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 6);'
      })
      
      if (altError) {
        console.error('❌ Alternative approach also failed:', altError)
        return false
      }
    }
    
    console.log('✅ Grade level column migration completed')
    return true
  } catch (error) {
    console.error('💥 Migration error:', error)
    return false
  }
}

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...')
    
    // Simple connection test
    const { data, error } = await supabase
      .from('topic_content_entries')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('💥 Connection error:', error)
    return false
  }
}

async function main() {
  console.log('🧪 Database Migration Test')
  console.log('==========================')
  
  const connected = await testConnection()
  if (!connected) {
    console.log('❌ Cannot proceed without database connection')
    return
  }
  
  const migrated = await addGradeLevelColumn()
  if (migrated) {
    console.log('🎉 Migration completed successfully!')
  } else {
    console.log('❌ Migration failed')
  }
}

main().catch(console.error)
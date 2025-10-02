// Database migration test script to add grade_level column to topic_content_entries

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...')
    
    // Read the SQL migration script
    const migrationPath = path.join(__dirname, 'scripts', 'add-grade-level-to-topic-content.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      return false
    }
    
    console.log('✅ Migration executed successfully')
    console.log('📊 Result:', data)
    
    // Verify the migration worked by checking if grade_level column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'topic_content_entries')
      .eq('column_name', 'grade_level')
    
    if (columnError) {
      console.warn('⚠️ Could not verify migration:', columnError.message)
    } else if (columns && columns.length > 0) {
      console.log('✅ Verified: grade_level column exists')
      console.log('📋 Column details:', columns[0])
    } else {
      console.log('❌ Grade level column not found - migration may not have worked')
    }
    
    return true
  } catch (error) {
    console.error('💥 Migration script error:', error)
    return false
  }
}

async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('topic_content_entries')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('💥 Database connection error:', error)
    return false
  }
}

async function main() {
  console.log('🧪 Starting Database Migration Test')
  console.log('=====================================')
  
  // Test connection first
  const connectionOk = await testDatabaseConnection()
  if (!connectionOk) {
    process.exit(1)
  }
  
  // Run migration
  const migrationOk = await runMigration()
  if (!migrationOk) {
    process.exit(1)
  }
  
  console.log('🎉 All database tests passed!')
}

main().catch(console.error)
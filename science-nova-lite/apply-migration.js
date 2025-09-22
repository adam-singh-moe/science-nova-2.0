// Script to apply the database migration to remove study areas
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Starting database migration to remove study areas...\n')
  
  try {
    // Read the migration script
    const migrationPath = path.join(__dirname, '../scripts/remove-study-areas-migration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration script loaded successfully')
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error)
          // Continue with other statements unless it's a critical error
          if (error.code !== '42703' && error.code !== '42P01') { // Column/table doesn't exist
            throw error
          } else {
            console.log('   ⚠️  Warning: Column or table may not exist (continuing...)')
          }
        } else {
          console.log('   ✅ Statement executed successfully')
        }
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('\nTesting topic creation after migration...')
    
    // Test topic creation
    const testTopic = {
      title: 'Test Topic - Photosynthesis',
      grade_level: 3,
      admin_prompt: 'Test prompt for photosynthesis',
      creator_id: '00000000-0000-0000-0000-000000000000' // Placeholder ID
    }

    const { data: newTopic, error: createError } = await supabase
      .from('topics')
      .insert(testTopic)
      .select()
      .single()

    if (createError) {
      console.error('❌ Topic creation still failing:', createError)
    } else {
      console.log('✅ Topic creation successful after migration:', newTopic.title)
      
      // Clean up test topic
      await supabase.from('topics').delete().eq('id', newTopic.id)
      console.log('🧹 Test topic cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
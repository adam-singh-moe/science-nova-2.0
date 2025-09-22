// Script to check the current database schema and test topic creation
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n')
  
  try {
    // Check topics table structure
    console.log('📋 Topics table structure:')
    const { data: topicsSchema, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'topics' })
    
    if (schemaError) {
      console.error('Schema error:', schemaError)
    } else if (topicsSchema) {
      console.log('Topics columns:', topicsSchema)
    }

    // Check if we can query topics table
    console.log('\n🔎 Testing topics table query:')
    const { data: topics, error: queryError } = await supabase
      .from('topics')
      .select('*')
      .limit(1)
    
    if (queryError) {
      console.error('Query error:', queryError)
    } else {
      console.log('Topics query successful. Sample data:', topics)
    }

    // Check study_areas table (should not exist)
    console.log('\n🚫 Checking if study_areas table still exists:')
    const { data: studyAreasTest, error: studyAreasError } = await supabase
      .from('study_areas')
      .select('*')
      .limit(1)
    
    if (studyAreasError) {
      if (studyAreasError.message.includes('does not exist')) {
        console.log('✅ Good! study_areas table has been removed')
      } else {
        console.error('Unexpected error:', studyAreasError)
      }
    } else {
      console.log('⚠️ study_areas table still exists:', studyAreasTest)
    }

    // Test topic creation
    console.log('\n🆕 Testing topic creation:')
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
      console.error('❌ Topic creation failed:', createError)
    } else {
      console.log('✅ Topic creation successful:', newTopic)
      
      // Clean up test topic
      await supabase.from('topics').delete().eq('id', newTopic.id)
      console.log('🧹 Test topic cleaned up')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkDatabaseSchema()
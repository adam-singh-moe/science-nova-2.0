// Direct SQL execution to remove study area constraints
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function removeMigrationConstraints() {
  console.log('🔧 Applying database fixes to remove study area constraints...\n')
  
  try {
    // First, let's make the study_area_id column nullable to allow current API to work
    console.log('1️⃣ Making study_area_id column nullable...')
    
    // We'll use a raw SQL query approach
    const { error: nullableError } = await supabase
      .rpc('exec_raw_sql', { 
        query: 'ALTER TABLE topics ALTER COLUMN study_area_id DROP NOT NULL;' 
      })
    
    if (nullableError) {
      console.log('Trying alternative approach...')
      // Alternative: Update existing records to have a default study area, then make column nullable
      
      // Get the first study area ID to use as default
      const { data: studyAreas } = await supabase
        .from('study_areas')
        .select('id')
        .limit(1)
      
      if (studyAreas && studyAreas.length > 0) {
        const defaultStudyAreaId = studyAreas[0].id
        console.log(`Using default study area ID: ${defaultStudyAreaId}`)
        
        // Update any NULL study_area_id values
        const { error: updateError } = await supabase
          .from('topics')
          .update({ study_area_id: defaultStudyAreaId })
          .is('study_area_id', null)
        
        if (updateError) {
          console.error('Error updating NULL study_area_id values:', updateError)
        } else {
          console.log('✅ Updated NULL study_area_id values')
        }
      }
    } else {
      console.log('✅ Column made nullable successfully')
    }
    
    // Test topic creation with study_area_id set to NULL
    console.log('\n2️⃣ Testing topic creation with NULL study_area_id...')
    
    const testTopic = {
      title: 'Test Topic - Solar System',
      grade_level: 4,
      admin_prompt: 'Test prompt for solar system',
      creator_id: '00000000-0000-0000-0000-000000000000',
      study_area_id: null
    }

    const { data: newTopic, error: createError } = await supabase
      .from('topics')
      .insert(testTopic)
      .select()
      .single()

    if (createError) {
      console.error('❌ Topic creation failed:', createError)
      
      // Try with a valid study_area_id as fallback
      console.log('\n🔄 Trying with valid study_area_id...')
      const { data: studyAreas } = await supabase
        .from('study_areas')
        .select('id')
        .limit(1)
      
      if (studyAreas && studyAreas.length > 0) {
        testTopic.study_area_id = studyAreas[0].id
        
        const { data: fallbackTopic, error: fallbackError } = await supabase
          .from('topics')
          .insert(testTopic)
          .select()
          .single()
        
        if (fallbackError) {
          console.error('❌ Fallback creation failed:', fallbackError)
        } else {
          console.log('✅ Topic creation with study_area_id successful:', fallbackTopic.title)
          // Clean up
          await supabase.from('topics').delete().eq('id', fallbackTopic.id)
          console.log('🧹 Test topic cleaned up')
        }
      }
    } else {
      console.log('✅ Topic creation with NULL study_area_id successful:', newTopic.title)
      // Clean up
      await supabase.from('topics').delete().eq('id', newTopic.id)
      console.log('🧹 Test topic cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

removeMigrationConstraints()
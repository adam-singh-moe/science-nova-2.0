// Quick script to get a valid study area ID for temporary fix
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getStudyAreaId() {
  const { data: studyAreas, error } = await supabase
    .from('study_areas')
    .select('id, name')
    .limit(5)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Available study areas:')
    studyAreas.forEach(area => {
      console.log(`- ${area.name}: ${area.id}`)
    })
    
    if (studyAreas.length > 0) {
      console.log(`\nUsing first study area ID: ${studyAreas[0].id}`)
    }
  }
}

getStudyAreaId()
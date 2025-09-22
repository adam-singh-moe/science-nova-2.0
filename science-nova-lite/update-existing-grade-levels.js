const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateExistingGradeLevels() {
  try {
    console.log('Updating existing content entries with grade levels...')
    
    // Get all content entries that don't have grade_level set
    const { data: entries, error: fetchError } = await supabase
      .from('topic_content_entries')
      .select('id, title, created_at')
      .is('grade_level', null)
      .limit(20)
    
    if (fetchError) {
      console.error('Error fetching entries:', fetchError)
      return
    }
    
    console.log(`Found ${entries.length} entries without grade levels`)
    
    if (entries.length === 0) {
      console.log('No entries to update')
      return
    }
    
    // Update entries with random grade levels between 1-6 for testing
    const updates = entries.map((entry, index) => {
      const gradeLevel = (index % 6) + 1 // Distribute evenly across grades 1-6
      return { id: entry.id, grade_level: gradeLevel }
    })
    
    // Update in batches
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('topic_content_entries')
        .update({ grade_level: update.grade_level })
        .eq('id', update.id)
      
      if (updateError) {
        console.error(`Error updating ${update.id}:`, updateError)
      } else {
        console.log(`Updated entry ${update.id} to grade ${update.grade_level}`)
      }
    }
    
    console.log('Finished updating grade levels')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

updateExistingGradeLevels()
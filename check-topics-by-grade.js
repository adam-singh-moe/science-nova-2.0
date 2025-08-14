const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTopicsByGrade() {
  console.log('📝 Checking topics by grade level...')
  
  for (let grade = 1; grade <= 6; grade++) {
    try {
      const { data: topics, error } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          grade_level,
          study_areas!inner (
            name,
            vanta_effect
          )
        `)
        .eq('grade_level', grade);
      
      if (error) {
        console.log(`❌ Error for Grade ${grade}:`, error.message);
      } else {
        console.log(`📚 Grade ${grade}: ${topics.length} topics`);
        topics.forEach((topic, i) => {
          console.log(`  ${i+1}. ${topic.title} (${topic.study_areas.name})`);
        });
        console.log(''); // Empty line for spacing
      }
    } catch (err) {
      console.log(`❌ Error for Grade ${grade}:`, err.message);
    }
  }
}

checkTopicsByGrade().catch(console.error)

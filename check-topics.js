const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Environment check:')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('SERVICE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Environment variables not loaded properly')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTopics() {
  console.log('📝 Checking topics for each grade...')
  
  for (let grade = 1; grade <= 6; grade++) {
    try {
      const { data: topics, error } = await supabase
        .from('topics')
        .select('id, title, grade')
        .eq('grade', grade);
      
      if (error) {
        console.log(`❌ Error for Grade ${grade}:`, error.message);
      } else {
        console.log(`📚 Grade ${grade}: ${topics.length} topics`);
        topics.forEach((topic, i) => {
          console.log(`  ${i+1}. ${topic.title}`);
        });
      }
    } catch (err) {
      console.log(`❌ Error for Grade ${grade}:`, err.message);
    }
  }
}

checkTopics().catch(console.error)

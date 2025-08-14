const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateUserToGrade4() {
  console.log('👤 Updating user to Grade 4...')
  
  try {
    const userId = '727d3042-fc6e-4d2c-af7b-a6343a2189a6'
    
    // Update profile to Grade 4
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        grade_level: 4,
        role: 'STUDENT'
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message)
    } else {
      console.log('✅ Profile updated to Grade 4')
      console.log('📧 Email: grade4test@example.com')
      console.log('🔑 Password: testuser123')
      console.log('🎓 Grade Level: 4')
      console.log('🆔 User ID:', userId)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

updateUserToGrade4().catch(console.error)

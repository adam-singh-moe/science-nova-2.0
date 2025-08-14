const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createGrade4User() {
  console.log('👤 Creating a Grade 4 test user...')
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'grade4test@example.com',
      password: 'testuser123',
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message)
      return
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: 'Grade 4 Test User',
        role: 'student',
        grade_level: 4,
        learning_preference: 'VISUAL'
      })

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message)
    } else {
      console.log('✅ Profile created for Grade 4 user')
      console.log('📧 Email: grade4test@example.com')
      console.log('🔑 Password: testuser123')
      console.log('🎓 Grade Level: 4')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

createGrade4User().catch(console.error)

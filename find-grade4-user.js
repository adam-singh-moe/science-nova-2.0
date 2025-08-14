const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findOrCreateGrade4User() {
  console.log('👤 Finding or creating a Grade 4 test user...')
  
  try {
    // Check if user already exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('❌ Error listing users:', userError.message)
      return
    }

    let testUser = users.users.find(user => user.email === 'grade4test@example.com')
    
    if (!testUser) {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'grade4test2@example.com',
        password: 'testuser123',
        email_confirm: true
      })

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message)
        return
      }
      
      testUser = authData.user
      console.log('✅ New auth user created:', testUser.id)
    } else {
      console.log('✅ Existing user found:', testUser.id)
    }

    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single()

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileCheckError.message)
      return
    }

    if (!existingProfile) {
      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUser.id,
          full_name: 'Grade 4 Test User',
          role: 'STUDENT',
          grade_level: 4,
          learning_preference: 'VISUAL'
        })
          })

      if (profileError) {
        console.error('❌ Error creating profile:', profileError.message)
      } else {
        console.log('✅ Profile created for Grade 4 user')
      }
    } else {
      // Update existing profile to Grade 4
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          grade_level: 4,
          role: 'STUDENT'
        })
        .eq('id', testUser.id)

      if (profileError) {
        console.error('❌ Error updating profile:', profileError.message)
      } else {
        console.log('✅ Profile updated to Grade 4')
      }
    }

    console.log('📧 Email:', testUser.email)
    console.log('🔑 Password: testuser123')
    console.log('🎓 Grade Level: 4')
    console.log('🆔 User ID:', testUser.id)

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

findOrCreateGrade4User().catch(console.error)

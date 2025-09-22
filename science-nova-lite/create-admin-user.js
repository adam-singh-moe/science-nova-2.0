require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js')

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!')
  console.log('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  
  if (!email || !password) {
    console.log('Usage: node create-admin-user.js <email> <password>')
    console.log('Example: node create-admin-user.js admin@example.com mypassword123')
    process.exit(1)
  }

  try {
    console.log('Creating admin user...')
    
    // Create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError) {
      console.error('Error creating auth user:', authError.message)
      return
    }

    console.log('Auth user created:', authData.user.id)

    // Create the profile with admin privileges
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: 'Admin User',
        grade_level: 12,
        learning_preference: 'visual',
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating profile:', profileError.message)
      return
    }

    console.log('✅ Admin user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Admin privileges: Yes')
    console.log('')
    console.log('You can now sign in at: http://localhost:3000/login')

  } catch (error) {
    console.error('Unexpected error:', error.message)
  }
}

createAdminUser()

const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

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

async function resetAdminPassword() {
  const email = 'admin@sciencenova.com'
  const newPassword = 'AdminPass123!'
  
  try {
    console.log('Resetting admin password...')
    
    // Find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError.message)
      return
    }

    const adminUser = users.users.find(user => user.email === email)
    
    if (!adminUser) {
      console.error('Admin user not found!')
      return
    }

    console.log('Found admin user:', adminUser.id)

    // Update the user's password
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        password: newPassword,
        email_confirm: true
      }
    )

    if (updateError) {
      console.error('Error updating password:', updateError.message)
      return
    }

    console.log('✅ Admin password reset successfully!')
    console.log('Email:', email)
    console.log('New Password:', newPassword)
    console.log('')
    console.log('You can now sign in at: http://localhost:3000/login')

  } catch (error) {
    console.error('Unexpected error:', error.message)
  }
}

resetAdminPassword()

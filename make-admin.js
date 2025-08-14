require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeUserAdmin() {
  const email = process.argv[2] || 'adamsingh017@gmail.com'
  
  try {
    console.log(`Making ${email} an admin...`)
    
    // Find user by email
    const { data: users, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching users:', authError.message)
      return
    }

    const user = users.users.find(u => u.email === email)
    if (!user) {
      console.error('User not found:', email)
      return
    }

    console.log('Found user:', user.id)

    // Update profile to make admin
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'ADMIN',
        learning_preference: 'VISUAL'
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError.message)
      return
    }

    console.log('✅ User is now an admin!')
    console.log('Email:', email)
    console.log('User ID:', user.id)
    console.log('')
    console.log('You can now sign in at: http://localhost:3000/login')

  } catch (error) {
    console.error('Unexpected error:', error.message)
  }
}

makeUserAdmin()

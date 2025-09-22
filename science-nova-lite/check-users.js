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

async function checkUsers() {
  try {
    // List auth users
    const { data: users, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching users:', authError.message)
      return
    }

    console.log('📧 Auth Users:')
    users.users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`)
    })

    // Check profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')

    if (profileError) {
      console.error('Error fetching profiles:', profileError.message)
      return
    }

    console.log('\n👤 Profiles:')
    profiles.forEach(profile => {
      console.log(`- ${profile.full_name} (Role: ${profile.role})`)
    })

  } catch (error) {
    console.error('Unexpected error:', error.message)
  }
}

checkUsers()

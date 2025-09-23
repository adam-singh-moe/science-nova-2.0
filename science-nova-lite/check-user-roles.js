const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase with service role key (not anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // This is the service role key, not anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndUpdateUserRole() {
  try {
    // Get all users to see current state
    console.log('Checking current user profiles...')
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching profiles:', error)
      return
    }

    console.log('Current profiles:')
    profiles.forEach(profile => {
      console.log(`- User ID: ${profile.id}`)
      console.log(`  Email: ${profile.email}`)
      console.log(`  Role: ${profile.role}`)
      console.log(`  Created: ${profile.created_at}`)
      console.log('---')
    })

    // If you have a specific user to update, uncomment and modify this:
    /*
    const userIdToUpdate = 'YOUR_USER_ID_HERE'
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'ADMIN' })
      .eq('id', userIdToUpdate)

    if (updateError) {
      console.error('Error updating user role:', updateError)
    } else {
      console.log('Successfully updated user role to ADMIN')
    }
    */

  } catch (error) {
    console.error('Error:', error)
  }
}

checkAndUpdateUserRole()
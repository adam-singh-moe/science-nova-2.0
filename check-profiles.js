require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
  try {
    console.log('👥 Checking profiles table for available user IDs...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Available user profiles:', data?.length || 0);
      if (data && data.length > 0) {
        data.forEach(profile => {
          console.log(`- ID: ${profile.id}`);
          console.log(`- Email: ${profile.email || 'no email'}`);
          console.log(`- Created: ${profile.created_at}`);
          console.log('---');
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProfiles();

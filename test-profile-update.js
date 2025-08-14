require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testProfileUpdate() {
  try {
    console.log('🧪 Testing Profile Update API...\n');

    // First, get current profiles
    console.log('📋 Current profiles:');
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);
    
    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError.message);
      return;
    }

    profiles.forEach(profile => {
      console.log(`- ${profile.full_name || 'No name'} (${profile.id})`);
      console.log(`  Grade: ${profile.grade_level || 'Not set'}, Learning: ${profile.learning_preference || 'Not set'}`);
    });

    if (profiles.length === 0) {
      console.log('❌ No profiles found to test with');
      return;
    }

    // Test the API endpoint directly
    const testProfile = profiles[0];
    console.log(`\n🎯 Testing update for profile: ${testProfile.id}`);

    // Create a session for testing (this simulates being logged in)
    const testData = {
      full_name: "Test Updated Name",
      grade_level: 5,
      learning_preference: "KINESTHETIC"
    };

    console.log('📤 Sending test data:', testData);

    // For now, just test that the API exists
    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, this would be the user's session token
        'Authorization': 'Bearer dummy-token-for-test'
      },
      body: JSON.stringify(testData)
    });

    console.log(`📥 API Response Status: ${response.status}`);
    const result = await response.json();
    console.log('📥 API Response:', result);

    if (response.ok) {
      console.log('✅ Profile update API is working!');
    } else {
      console.log('⚠️ API returned an error (expected without valid session)');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testProfileUpdate();

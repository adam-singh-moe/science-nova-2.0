const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updatePrivilegedUsersToGrade0() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔄 Updating all privileged users (ADMIN, TEACHER, DEVELOPER) to grade_level = 0...');
  console.log('⚠️  NOTE: This requires the database constraint to be updated first!');
  console.log('   Database constraint should allow: CHECK (grade_level >= 0 AND grade_level <= 6)');
  console.log('');

  try {
    // First, let's see who we're updating
    const { data: privilegedUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, role, grade_level')
      .in('role', ['ADMIN', 'TEACHER', 'DEVELOPER']);

    if (fetchError) {
      console.error('❌ Error fetching privileged users:', fetchError.message);
      return;
    }

    console.log(`📊 Found ${privilegedUsers.length} privileged users to update:`);
    privilegedUsers.forEach(user => {
      console.log(`   - ${user.full_name} (${user.role}) - Current grade: ${user.grade_level}`);
    });
    console.log('');

    if (privilegedUsers.length === 0) {
      console.log('✅ No privileged users found to update.');
      return;
    }

    // Update all privileged users to grade 0
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ grade_level: 0 })
      .in('role', ['ADMIN', 'TEACHER', 'DEVELOPER'])
      .select('full_name, role, grade_level');

    if (updateError) {
      console.error('❌ Error updating privileged users:', updateError.message);
      console.log('');
      console.log('🔧 SOLUTION: Update the database constraint in Supabase dashboard:');
      console.log('   1. Go to Database → Tables → profiles');
      console.log('   2. Find constraint "profiles_grade_level_check"');
      console.log('   3. Change from: CHECK (grade_level >= 1 AND grade_level <= 6)');
      console.log('   4. Change to:   CHECK (grade_level >= 0 AND grade_level <= 6)');
      return;
    }

    console.log('✅ Successfully updated privileged users:');
    updateResult.forEach(user => {
      console.log(`   - ${user.full_name} (${user.role}) → grade_level: ${user.grade_level}`);
    });
    console.log('');
    console.log('🎉 All privileged users now use grade_level = 0 (access to all grades)');
    console.log('📚 Students continue to use grade_level = 1-6 (access to specific grade)');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Run the update
updatePrivilegedUsersToGrade0();

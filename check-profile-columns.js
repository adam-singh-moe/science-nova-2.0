require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addProfileColumns() {
  try {
    console.log('🔍 Checking profiles table structure...\n');

    // First, check current table structure
    const { data: currentStructure, error: structError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (structError) {
      console.error('❌ Error checking table structure:', structError.message);
      return;
    }

    if (currentStructure && currentStructure.length > 0) {
      console.log('📋 Current profiles table columns:');
      const sampleRow = currentStructure[0];
      Object.keys(sampleRow).forEach(column => {
        console.log(`  ✓ ${column}: ${typeof sampleRow[column]}`);
      });
      console.log('');
    }

    // Check if grade_level column exists
    const hasGradeLevel = currentStructure && currentStructure.length > 0 && 
                         'grade_level' in currentStructure[0];
    
    const hasUpdatedAt = currentStructure && currentStructure.length > 0 && 
                        'updated_at' in currentStructure[0];

    console.log('🔍 Column existence check:');
    console.log(`  grade_level: ${hasGradeLevel ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  updated_at: ${hasUpdatedAt ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log('');

    if (hasGradeLevel && hasUpdatedAt) {
      console.log('✅ All required columns already exist in profiles table!');
      console.log('🎉 Profile save functionality should work correctly.');
      return;
    }

    // If columns are missing, we need to add them via SQL
    if (!hasGradeLevel || !hasUpdatedAt) {
      console.log('⚠️  Some columns are missing. These would need to be added via database admin tools:');
      
      if (!hasGradeLevel) {
        console.log('📝 SQL to add grade_level:');
        console.log('   ALTER TABLE profiles ADD COLUMN grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12);');
      }
      
      if (!hasUpdatedAt) {
        console.log('📝 SQL to add updated_at:');
        console.log('   ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
      }
      
      console.log('\n💡 Note: Column additions require database admin privileges.');
      console.log('   Contact your database administrator or use Supabase dashboard SQL editor.');
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

addProfileColumns();

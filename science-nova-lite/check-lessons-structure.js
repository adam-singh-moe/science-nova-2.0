require('dotenv').config({path:'.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLessonsStructure() {
  try {
    // First, let's see what columns exist by selecting all columns from one row
    const { data: sampleData, error: sampleError } = await supabase
      .from('lessons')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
      return;
    }

    console.log('Sample lesson data (first row):');
    console.log(JSON.stringify(sampleData, null, 2));

    if (sampleData && sampleData.length > 0) {
      console.log('\nAvailable columns in lessons table:');
      console.log(Object.keys(sampleData[0]));
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkLessonsStructure();
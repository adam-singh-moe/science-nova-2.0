require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTextbookBucket() {
  console.log('🔍 Checking textbook_content bucket in detail...\n');
  
  try {
    // List root level
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('textbook_content')
      .list('', { limit: 100 });
    
    if (rootError) {
      console.log('❌ Error listing root:', rootError);
      return;
    }
    
    console.log('📂 Root level contents:');
    if (rootFiles.length === 0) {
      console.log('📭 Empty');
    } else {
      rootFiles.forEach(item => {
        console.log(`   ${item.name} (${item.metadata?.size || 'unknown size'})`);
      });
    }
    
    // Check grade_1 folder specifically
    console.log('\n📚 Checking grade_1 folder:');
    const { data: grade1Files, error: grade1Error } = await supabase.storage
      .from('textbook_content')
      .list('grade_1', { limit: 100 });
    
    if (grade1Error) {
      console.log('❌ Error listing grade_1:', grade1Error);
    } else {
      if (grade1Files.length === 0) {
        console.log('📭 Empty');
      } else {
        grade1Files.forEach(file => {
          console.log(`   📄 ${file.name} (${file.metadata?.size || 'unknown size'})`);
          console.log(`      Created: ${file.created_at}`);
          console.log(`      Updated: ${file.updated_at}`);
        });
      }
    }
    
    // Test accessing the specific file
    console.log('\n🌐 Testing file access:');
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('textbook_content')
      .createSignedUrl('grade_1/Science Around Us Book 1.pdf', 60);
    
    if (urlError) {
      console.log('❌ Error creating signed URL:', urlError);
    } else {
      console.log('✅ Signed URL created:', signedUrl.signedUrl);
      
      // Test the URL
      try {
        const response = await fetch(signedUrl.signedUrl);
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', response.headers.get('content-type'));
      } catch (fetchError) {
        console.log('❌ Fetch error:', fetchError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTextbookBucket();
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Using Service Role Key:', supabaseKey ? 'Found' : 'Missing');
console.log('');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  console.log('🗂️ Checking available storage buckets...\n');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }
    
    console.log('📂 Available buckets:');
    data.forEach((bucket, index) => {
      console.log(`${index + 1}. Name: "${bucket.name}"`);
      console.log(`   ID: ${bucket.id}`);
      console.log(`   Created: ${bucket.created_at}`);
      console.log(`   Public: ${bucket.public}`);
      console.log('');
    });
    
    // Check each bucket's contents
    for (const bucket of data) {
      console.log(`🔍 Checking contents of "${bucket.name}":`);
      const { data: files, error: listError } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 100 });
      
      if (listError) {
        console.log(`   ❌ Error: ${listError.message}`);
      } else {
        if (files.length === 0) {
          console.log('   📭 Empty bucket');
        } else {
          files.forEach(file => {
            console.log(`   📄 ${file.name} (${file.metadata?.size || 'unknown size'})`);
          });
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkBuckets();
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStoragePolicies() {
  console.log('🔐 Checking Storage Bucket Permissions and Policies...\n');
  
  try {
    // Check bucket details
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📂 Available buckets and their settings:');
    buckets.forEach(bucket => {
      console.log(`\n🗂️ Bucket: ${bucket.name} (ID: ${bucket.id})`);
      console.log(`   Public: ${bucket.public}`);
      console.log(`   Created: ${bucket.created_at}`);
      console.log(`   File size limit: ${bucket.file_size_limit || 'No limit'}`);
      console.log(`   Allowed MIME types: ${bucket.allowed_mime_types || 'All types'}`);
    });
    
    // Try to check policies using service client
    console.log('\n🔒 Checking storage policies...');
    
    // Check if we can list policies (this might require special permissions)
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1);
      
      if (policiesError) {
        console.log('⚠️ Cannot directly query storage policies:', policiesError.message);
        console.log('💡 This is normal - policies are usually configured in Supabase dashboard');
      } else {
        console.log('✅ Storage objects table accessible');
      }
    } catch (e) {
      console.log('⚠️ Storage policies check limited with current permissions');
    }
    
    // Test different authentication scenarios
    console.log('\n🧪 Testing different upload scenarios...');
    
    // Test 1: Service role upload (should work)
    console.log('\n1️⃣ Testing service role upload...');
    const testContent = new TextEncoder().encode('Test file content');
    
    const { data: serviceUpload, error: serviceError } = await supabase.storage
      .from('textbook_content')
      .upload('test_permissions/service_role_test.txt', testContent, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (serviceError) {
      console.log('❌ Service role upload failed:', serviceError);
    } else {
      console.log('✅ Service role upload successful');
      
      // Clean up test file
      await supabase.storage
        .from('textbook_content')
        .remove(['test_permissions/service_role_test.txt']);
    }
    
    // Test 2: Anonymous client upload (simulating direct Supabase interface)
    console.log('\n2️⃣ Testing anonymous client upload...');
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: anonUpload, error: anonError } = await anonClient.storage
      .from('textbook_content')
      .upload('test_permissions/anon_test.txt', testContent, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (anonError) {
      console.log('❌ Anonymous upload failed:', anonError);
      console.log('💡 This suggests RLS policies are restricting uploads');
    } else {
      console.log('✅ Anonymous upload successful');
      
      // Clean up
      await anonClient.storage
        .from('textbook_content')
        .remove(['test_permissions/anon_test.txt']);
    }
    
    // Test 3: Check bucket public access
    console.log('\n3️⃣ Testing bucket public access settings...');
    
    const publicUrl = supabase.storage
      .from('textbook_content')
      .getPublicUrl('grade_1/Science Around Us Book 1.pdf');
    
    console.log('📄 Public URL:', publicUrl.data.publicUrl);
    
    // Test the public URL
    try {
      const response = await fetch(publicUrl.data.publicUrl);
      console.log('🌐 Public URL status:', response.status);
      
      if (response.status === 403) {
        console.log('🔒 Bucket is private - requires authentication');
      } else if (response.status === 200) {
        console.log('🔓 Bucket allows public access');
      }
    } catch (fetchError) {
      console.log('❌ Public URL test failed:', fetchError.message);
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('');
    console.log('1. Check your Supabase dashboard > Storage > Settings');
    console.log('2. Verify bucket policies allow uploads for authenticated users');
    console.log('3. Ensure RLS (Row Level Security) policies are configured properly');
    console.log('4. Consider making buckets public if you want direct uploads');
    console.log('');
    console.log('Common policy for authenticated uploads:');
    console.log('CREATE POLICY "Authenticated users can upload" ON storage.objects');
    console.log('FOR INSERT WITH CHECK (auth.role() = \'authenticated\');');
    console.log('');
    console.log('🔗 Check policies at: https://supabase.com/dashboard/project/[PROJECT_ID]/storage/policies');
    
  } catch (error) {
    console.error('❌ Error checking storage policies:', error);
  }
}

checkStoragePolicies();
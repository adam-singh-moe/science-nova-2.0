require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectUpload() {
  console.log('🧪 Testing Direct Upload vs Application Upload...\n');
  
  try {
    // Create a simple PDF for testing
    const simplePdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Permission Upload) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000229 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
323
%%EOF`;

    const pdfBuffer = new TextEncoder().encode(simplePdfContent);
    
    console.log('📄 Created test PDF content');
    
    // Test 1: Service role upload (what our application uses)
    console.log('\n1️⃣ Testing service role upload to textbook_content bucket...');
    
    const { data: serviceUpload, error: serviceError } = await supabase.storage
      .from('textbook_content')
      .upload('test_permissions/service_test.pdf', pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (serviceError) {
      console.log('❌ Service role upload failed:', serviceError);
    } else {
      console.log('✅ Service role upload successful');
      console.log('📂 File path:', serviceUpload.path);
      
      // Test public access
      const publicUrl = supabase.storage
        .from('textbook_content')
        .getPublicUrl('test_permissions/service_test.pdf');
      
      console.log('🌐 Public URL:', publicUrl.data.publicUrl);
      
      // Test access
      const response = await fetch(publicUrl.data.publicUrl);
      console.log('📊 Access status:', response.status);
    }
    
    // Test 2: Anonymous client (simulating Supabase dashboard direct upload)
    console.log('\n2️⃣ Testing anonymous upload (simulating direct Supabase upload)...');
    
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: anonUpload, error: anonError } = await anonClient.storage
      .from('textbook_content')
      .upload('test_permissions/anon_test.pdf', pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (anonError) {
      console.log('❌ Anonymous upload failed:', anonError);
      console.log('💡 This explains why direct Supabase uploads fail!');
    } else {
      console.log('✅ Anonymous upload successful');
    }
    
    // Test 3: Check what happens when creating folders
    console.log('\n3️⃣ Testing folder creation scenarios...');
    
    // Try to create a new grade folder
    const { data: folderUpload, error: folderError } = await supabase.storage
      .from('textbook_content')
      .upload('grade_7/new_textbook.pdf', pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (folderError) {
      console.log('❌ New folder upload failed:', folderError);
    } else {
      console.log('✅ New folder creation successful');
      console.log('📁 Created: grade_7/new_textbook.pdf');
    }
    
    // Test the Curriculums bucket (private)
    console.log('\n4️⃣ Testing private bucket (Curriculums)...');
    
    const { data: curriculumUpload, error: curriculumError } = await supabase.storage
      .from('Curriculums')
      .upload('test_permissions/curriculum_test.pdf', pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (curriculumError) {
      console.log('❌ Curriculum bucket upload failed:', curriculumError);
    } else {
      console.log('✅ Curriculum bucket upload successful');
    }
    
    // Test anonymous upload to private bucket
    const { data: anonCurriculumUpload, error: anonCurriculumError } = await anonClient.storage
      .from('Curriculums')
      .upload('test_permissions/anon_curriculum_test.pdf', pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (anonCurriculumError) {
      console.log('❌ Anonymous curriculum upload failed:', anonCurriculumError);
      console.log('💡 Private buckets require authentication');
    } else {
      console.log('✅ Anonymous curriculum upload successful');
    }
    
    // Summary
    console.log('\n📋 SUMMARY - Why Direct Supabase Uploads Fail:');
    console.log('');
    console.log('🔐 The issue is likely one of these:');
    console.log('1. RLS (Row Level Security) policies require authentication');
    console.log('2. Storage policies only allow uploads from authenticated users');
    console.log('3. Direct Supabase dashboard uploads use anonymous access');
    console.log('4. Your application works because it uses service role/authenticated access');
    console.log('');
    console.log('✅ SOLUTIONS:');
    console.log('1. Use the application interface for uploads (recommended)');
    console.log('2. Configure storage policies to allow anonymous uploads (less secure)');
    console.log('3. Authenticate in Supabase dashboard before uploading');
    console.log('');
    console.log('🔧 To allow direct uploads, you would need to add policies like:');
    console.log('CREATE POLICY "Allow public uploads" ON storage.objects');
    console.log('FOR INSERT WITH CHECK (bucket_id = \'textbook_content\');');
    
    // Cleanup test files
    console.log('\n🧹 Cleaning up test files...');
    
    const filesToClean = [
      'test_permissions/service_test.pdf',
      'test_permissions/anon_test.pdf',
      'test_permissions/curriculum_test.pdf',
      'test_permissions/anon_curriculum_test.pdf',
      'grade_7/new_textbook.pdf'
    ];
    
    for (const bucket of ['textbook_content', 'Curriculums']) {
      await supabase.storage.from(bucket).remove(filesToClean);
    }
    
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDirectUpload();
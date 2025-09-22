const fs = require('fs');

// Load environment variables from .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envVars = envContent.split('\n');
  
  envVars.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');
        process.env[key] = value;
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

async function organizeDocuments() {
  console.log('📚 Organizing Documents...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase configuration');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check the "Science Around Us Book 1.pdf" in Curriculums bucket
    console.log('\n🔍 Checking current document organization...');
    
    const { data: files, error } = await supabase.storage
      .from('Curriculums')
      .list('grade_1');
    
    if (error) {
      console.log('❌ Error listing files:', error);
      return;
    }
    
    const scienceBook = files?.find(f => f.name === 'Science Around Us Book 1.pdf');
    
    if (scienceBook) {
      console.log('📖 Found "Science Around Us Book 1.pdf" in Curriculums bucket');
      console.log('📝 This appears to be a textbook based on the name');
      console.log('🔄 Moving to Textbook Content bucket...');
      
      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('Curriculums')
        .download('grade_1/Science Around Us Book 1.pdf');
      
      if (downloadError) {
        console.log('❌ Error downloading file:', downloadError);
        return;
      }
      
      // Convert to array buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);
      
      // Create grade_1 folder in Textbook Content bucket if it doesn't exist
      const { data: textbookFiles } = await supabase.storage
        .from('textbook_content')
        .list('grade_1');
      
      if (!textbookFiles || textbookFiles.length === 0) {
        console.log('📁 Creating grade_1 folder in Textbook Content bucket...');
        await supabase.storage
          .from('textbook_content')
          .upload('grade_1/.emptyFolderPlaceholder', new Uint8Array([]));
      }
      
      // Upload to Textbook Content bucket
      const { error: uploadError } = await supabase.storage
        .from('textbook_content')
        .upload('grade_1/Science Around Us Book 1.pdf', fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) {
        console.log('❌ Error uploading to Textbook Content:', uploadError);
        return;
      }
      
      console.log('✅ Successfully moved to Textbook Content bucket');
      
      // Optionally remove from Curriculums bucket
      console.log('🗑️ Removing from Curriculums bucket...');
      const { error: removeError } = await supabase.storage
        .from('Curriculums')
        .remove(['grade_1/Science Around Us Book 1.pdf']);
      
      if (removeError) {
        console.log('⚠️ Warning: Could not remove from Curriculums bucket:', removeError);
      } else {
        console.log('✅ Successfully removed from Curriculums bucket');
      }
      
      // Test the new URLs
      console.log('\n🌐 Testing new URLs...');
      
      const publicUrl = supabase.storage
        .from('textbook_content')
        .getPublicUrl('grade_1/Science Around Us Book 1.pdf').data.publicUrl;
      
      const { data: signedUrl } = await supabase.storage
        .from('textbook_content')
        .createSignedUrl('grade_1/Science Around Us Book 1.pdf', 3600);
      
      console.log('📄 Public URL:', publicUrl);
      console.log('🔐 Signed URL:', signedUrl?.signedUrl || signedUrl);
      
      // Test URL access
      const testUrl = signedUrl?.signedUrl || publicUrl;
      const response = await fetch(testUrl);
      console.log('🌐 URL test status:', response.status);
      
      if (response.ok) {
        console.log('✅ Document is now accessible!');
      } else {
        console.log('❌ Document access test failed');
      }
      
    } else {
      console.log('📭 No documents found in Curriculums/grade_1 to organize');
    }
    
    // Create sample curriculum document in Curriculums bucket for testing
    console.log('\n📚 Creating sample curriculum document...');
    
    const sampleCurriculumContent = `%PDF-1.4
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
(Sample Curriculum Document) Tj
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
    
    const { error: curriculumUploadError } = await supabase.storage
      .from('Curriculums')
      .upload('grade_1/Sample Curriculum Guide.pdf', new TextEncoder().encode(sampleCurriculumContent), {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (curriculumUploadError) {
      console.log('⚠️ Warning: Could not create sample curriculum:', curriculumUploadError);
    } else {
      console.log('✅ Created sample curriculum document');
    }
    
    console.log('\n🎉 Document organization complete!');
    console.log('📚 Textbook Content bucket: Contains textbooks');
    console.log('📖 Curriculums bucket: Contains curriculum guides');
    
  } catch (error) {
    console.log('❌ Error during organization:', error);
  }
}

organizeDocuments();
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

async function debugStorageBuckets() {
  console.log('🔍 Debugging Storage Buckets...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase configuration');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // List all buckets
    console.log('\n📦 Listing all storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Found buckets:', buckets.map(b => b.name));
    
    // Check specifically for Textbook Content and Curriculums buckets
    const textbookBucket = buckets.find(b => b.name === 'Textbook Content');
    const curriculumBucket = buckets.find(b => b.name === 'Curriculums');
    
    console.log('\n📚 Textbook Content bucket:', textbookBucket ? '✅ Exists' : '❌ Missing');
    console.log('📖 Curriculums bucket:', curriculumBucket ? '✅ Exists' : '❌ Missing');
    
    // If buckets don't exist, create them
    if (!textbookBucket) {
      console.log('\n🔧 Creating Textbook Content bucket...');
      const { error } = await supabase.storage.createBucket('Textbook Content', {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: ['application/pdf']
      });
      
      if (error) {
        console.log('❌ Error creating Textbook Content bucket:', error);
      } else {
        console.log('✅ Created Textbook Content bucket');
      }
    }
    
    if (!curriculumBucket) {
      console.log('\n🔧 Creating Curriculums bucket...');
      const { error } = await supabase.storage.createBucket('Curriculums', {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: ['application/pdf']
      });
      
      if (error) {
        console.log('❌ Error creating Curriculums bucket:', error);
      } else {
        console.log('✅ Created Curriculums bucket');
      }
    }
    
    // Check folders in each bucket
    for (const bucketName of ['Textbook Content', 'Curriculums']) {
      console.log(`\n📁 Checking folders in ${bucketName} bucket...`);
      
      const { data: folders, error: foldersError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 100 });
      
      if (foldersError) {
        console.log(`❌ Error listing folders in ${bucketName}:`, foldersError);
        continue;
      }
      
      console.log(`✅ Found ${folders.length} items in ${bucketName}:`);
      
      for (const folder of folders) {
        console.log(`  📂 ${folder.name} (${folder.metadata?.size || 'unknown size'})`);
        
        // If it's a grade folder, check its contents
        if (folder.name.startsWith('grade_')) {
          const { data: files, error: filesError } = await supabase.storage
            .from(bucketName)
            .list(folder.name);
          
          if (!filesError && files) {
            console.log(`    📄 Found ${files.length} files:`);
            files.forEach(file => {
              const publicUrl = supabase.storage
                .from(bucketName)
                .getPublicUrl(`${folder.name}/${file.name}`).data.publicUrl;
              
              console.log(`      - ${file.name} (${file.metadata?.size || 'unknown size'})`);
              console.log(`        URL: ${publicUrl}`);
            });
          }
        }
      }
    }
    
    // Test a public URL to see if it works
    console.log('\n🌐 Testing public URL access...');
    
    const testResponse = await fetch('https://jjbfojphsvqxgxbsqlgw.supabase.co/storage/v1/object/public/Curriculums/grade_1/Science%20Around%20Us%20Book%201.pdf');
    console.log('Test URL status:', testResponse.status);
    console.log('Test URL headers:', Object.fromEntries(testResponse.headers.entries()));
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Error during debugging:', error);
  }
}

debugStorageBuckets();
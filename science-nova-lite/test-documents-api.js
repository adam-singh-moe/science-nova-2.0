require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testDocumentsAPI() {
  console.log('🧪 Testing Documents API...\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Sign in as admin user to get authorization token
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Authenticated as:', authData.user.email);
    
    // Get session token
    const session = authData.session;
    if (!session) {
      console.log('❌ No session found');
      return;
    }
    
    // Test documents API with authorization
    console.log('\n🔍 Testing documents API...');
    
    const response = await fetch('http://localhost:3000/api/documents', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📄 Documents found:', data.length);
      
      data.forEach(doc => {
        console.log(`   📚 ${doc.name}`);
        console.log(`      Type: ${doc.type}`);
        console.log(`      Grade: ${doc.grade}`);
        console.log(`      Bucket: ${doc.bucket}`);
        console.log(`      URL: ${doc.url ? 'Available' : 'Missing'}`);
        console.log('');
      });
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
    // Test specific type filters
    console.log('\n🔍 Testing textbook filter...');
    const textbookResponse = await fetch('http://localhost:3000/api/documents?type=textbook', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (textbookResponse.ok) {
      const textbookData = await textbookResponse.json();
      console.log('📚 Textbooks found:', textbookData.length);
      textbookData.forEach(doc => {
        console.log(`   📖 ${doc.name} (Grade ${doc.grade})`);
      });
    }
    
    console.log('\n🔍 Testing curriculum filter...');
    const curriculumResponse = await fetch('http://localhost:3000/api/documents?type=curriculum', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (curriculumResponse.ok) {
      const curriculumData = await curriculumResponse.json();
      console.log('📖 Curricula found:', curriculumData.length);
      curriculumData.forEach(doc => {
        console.log(`   📋 ${doc.name} (Grade ${doc.grade})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDocumentsAPI();
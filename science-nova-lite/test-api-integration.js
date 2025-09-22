const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testApiIntegration() {
  console.log('🔗 Testing Grade Filtering API Integration\n');
  
  // Get the admin user info
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id, full_name, role, grade_level')
    .eq('role', 'ADMIN')
    .single();
    
  if (!adminProfile) {
    console.log('❌ No admin user found');
    return;
  }
  
  console.log('👤 Admin User:');
  console.log(`  ID: ${adminProfile.id}`);
  console.log(`  Name: ${adminProfile.full_name}`);
  console.log(`  Role: ${adminProfile.role}`);
  console.log(`  Grade Level: ${adminProfile.grade_level || 'null (sees all grades)'}`);
  
  // Simulate API call for Discovery Daily
  const { data: discoveryContent, error: discoveryError } = await supabase
    .from('topic_content_entries')
    .select(`
      id,
      title,
      preview_text,
      topic_id,
      topics!inner(
        title,
        grade_level
      )
    `)
    .eq('category', 'DISCOVERY')
    .eq('status', 'published');
    
  if (discoveryError) {
    console.log('❌ Discovery query error:', discoveryError);
    return;
  }
  
  console.log('\n📊 Discovery Content Available to Admin:');
  console.log(`  Found ${discoveryContent?.length || 0} items`);
  
  if (!discoveryContent || discoveryContent.length === 0) {
    console.log('  No discovery content found');
    return;
  }
  
  const discoveryByGrade = {};
  discoveryContent.forEach(item => {
    const grade = item.topics.grade_level;
    if (!discoveryByGrade[grade]) {
      discoveryByGrade[grade] = [];
    }
    discoveryByGrade[grade].push({
      topic: item.topics.title,
      title: item.title
    });
  });
  
  Object.keys(discoveryByGrade).sort().forEach(grade => {
    console.log(`  Grade ${grade}:`);
    discoveryByGrade[grade].forEach(item => {
      console.log(`    - ${item.title} (${item.topic})`);
    });
  });
  
  // Test what a Grade 5 student would see
  console.log('\n🎓 Simulating Grade 5 Student View:');
  const minGrade = Math.max(1, 5 - 1); // 4
  const maxGrade = Math.min(12, 5 + 1); // 6
  
  const { data: studentContent } = await supabase
    .from('topic_content_entries')
    .select(`
      id,
      title,
      preview_text,
      topic_id,
      topics!inner(
        title,
        grade_level
      )
    `)
    .eq('category', 'DISCOVERY')
    .eq('status', 'published')
    .gte('topics.grade_level', minGrade)
    .lte('topics.grade_level', maxGrade);
    
  console.log(`  Grade Range: ${minGrade}-${maxGrade}`);
  const studentByGrade = {};
  studentContent.forEach(item => {
    const grade = item.topics.grade_level;
    if (!studentByGrade[grade]) {
      studentByGrade[grade] = [];
    }
    studentByGrade[grade].push({
      topic: item.topics.title,
      title: item.title
    });
  });
  
  Object.keys(studentByGrade).sort().forEach(grade => {
    console.log(`  Grade ${grade}:`);
    studentByGrade[grade].forEach(item => {
      console.log(`    - ${item.title} (${item.topic})`);
    });
  });
  
  console.log(`\n✅ API Integration test complete!`);
  console.log(`📈 Content Filtering Summary:`);
  console.log(`  - Admin sees: ${discoveryContent.length} items across ${Object.keys(discoveryByGrade).length} grade levels`);
  console.log(`  - Grade 5 student sees: ${studentContent.length} items across ${Object.keys(studentByGrade).length} grade levels`);
}

testApiIntegration().catch(console.error);
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testGradeLevelFiltering() {
  console.log('🎓 Testing Grade Level Filtering\n');
  
  // First, let's see all the topics and their grade levels
  const { data: topics } = await supabase
    .from('topics')
    .select('id, title, grade_level')
    .order('grade_level');
    
  console.log('📚 All Topics and Grade Levels:');
  topics.forEach(topic => {
    console.log(`  Grade ${topic.grade_level}: ${topic.title}`);
  });
  
  // Check what our current admin user's profile looks like
  const adminUserId = '58ed7802-ff6c-4333-bc52-3a1dc20a58fc';
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('full_name, grade_level, role')
    .eq('id', adminUserId)
    .single();
    
  console.log(`\n👤 Admin User Profile:`, adminProfile);
  
  // Create a test student with grade level 5
  const testStudentId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
  const testStudentData = {
    id: testStudentId,
    full_name: 'Test Student',
    grade_level: 5,
    role: 'STUDENT',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Insert test student (ignore if already exists)
  await supabase
    .from('profiles')
    .upsert(testStudentData, { onConflict: 'id' });
    
  console.log(`\n📝 Created test student: Grade ${testStudentData.grade_level}`);
  
  // Test the filtering logic for different users
  const testUsers = [
    { id: 'anon', name: 'Anonymous', expectedGrade: null },
    { id: adminUserId, name: 'Admin User', expectedGrade: null }, // Admins see all
    { id: testStudentId, name: 'Test Student', expectedGrade: 5 }
  ];
  
  for (const testUser of testUsers) {
    console.log(`\n🔍 Testing user: ${testUser.name}`);
    
    // Simulate the API logic
    let userGradeLevel = null;
    if (testUser.id !== 'anon') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level, role')
        .eq('id', testUser.id)
        .single();
      
      if (profile?.role === 'STUDENT' && profile?.grade_level) {
        userGradeLevel = profile.grade_level;
      }
    }
    
    console.log(`  User grade level for filtering: ${userGradeLevel || 'none (sees all)'}`);
    
    // Test Discovery content filtering
    let discoveryQuery = supabase
      .from('topic_content_entries')
      .select('topic_id, topics!inner(title, grade_level)')
      .eq('category','DISCOVERY')
      .eq('status','published');
    
    if (userGradeLevel !== null) {
      const minGrade = Math.max(1, userGradeLevel - 1);
      const maxGrade = Math.min(12, userGradeLevel + 1);
      discoveryQuery = discoveryQuery
        .gte('topics.grade_level', minGrade)
        .lte('topics.grade_level', maxGrade);
    }
    
    const { data: discoveryRows } = await discoveryQuery;
    const discoveryTopics = Array.from(new Set(discoveryRows.map(r => ({
      id: r.topic_id,
      title: r.topics.title,
      grade: r.topics.grade_level
    }))));
    
    console.log(`  Discovery topics available (${discoveryTopics.length}):`);
    discoveryTopics.forEach(topic => {
      console.log(`    Grade ${topic.grade}: ${topic.title}`);
    });
    
    // Test Arcade content filtering
    let arcadeQuery = supabase
      .from('topic_content_entries')
      .select('topic_id, topics!inner(title, grade_level)')
      .eq('category','ARCADE')
      .eq('status','published');
    
    if (userGradeLevel !== null) {
      const minGrade = Math.max(1, userGradeLevel - 1);
      const maxGrade = Math.min(12, userGradeLevel + 1);
      arcadeQuery = arcadeQuery
        .gte('topics.grade_level', minGrade)
        .lte('topics.grade_level', maxGrade);
    }
    
    const { data: arcadeRows } = await arcadeQuery;
    const arcadeTopics = Array.from(new Set(arcadeRows.map(r => ({
      id: r.topic_id,
      title: r.topics.title,
      grade: r.topics.grade_level
    }))));
    
    console.log(`  Arcade topics available (${arcadeTopics.length}):`);
    arcadeTopics.forEach(topic => {
      console.log(`    Grade ${topic.grade}: ${topic.title}`);
    });
  }
  
  // Clean up test student
  await supabase
    .from('profiles')
    .delete()
    .eq('id', testStudentId);
    
  console.log(`\n✅ Test completed and cleanup done!`);
}

testGradeLevelFiltering().catch(console.error);
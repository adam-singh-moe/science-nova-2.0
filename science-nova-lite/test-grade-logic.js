const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testGradeFilteringSimple() {
  console.log('🎓 Testing Grade Level Filtering Logic\n');
  
  // Show all topics and their grades
  const { data: topics } = await supabase
    .from('topics')
    .select('id, title, grade_level')
    .order('grade_level');
    
  console.log('📚 Available Topics:');
  topics.forEach(topic => {
    console.log(`  Grade ${topic.grade_level}: ${topic.title}`);
  });
  
  // Test the filtering logic for different grade levels
  const testGrades = [null, 4, 5, 6];
  
  for (const userGrade of testGrades) {
    console.log(`\n🔍 Testing Grade Level: ${userGrade || 'none (Admin/Teacher)'}`);
    
    // Simulate the API logic for Discovery
    let discoveryQuery = supabase
      .from('topic_content_entries')
      .select('topic_id, topics!inner(title, grade_level)')
      .eq('category','DISCOVERY')
      .eq('status','published');
    
    if (userGrade !== null) {
      const minGrade = Math.max(1, userGrade - 1);
      const maxGrade = Math.min(12, userGrade + 1);
      console.log(`  Filtering range: Grades ${minGrade}-${maxGrade}`);
      discoveryQuery = discoveryQuery
        .gte('topics.grade_level', minGrade)
        .lte('topics.grade_level', maxGrade);
    } else {
      console.log(`  No filtering - sees all content`);
    }
    
    const { data: discoveryRows } = await discoveryQuery;
    const discoveryTopics = {};
    discoveryRows.forEach(row => {
      if (!discoveryTopics[row.topic_id]) {
        discoveryTopics[row.topic_id] = {
          title: row.topics.title,
          grade: row.topics.grade_level,
          count: 0
        };
      }
      discoveryTopics[row.topic_id].count++;
    });
    
    console.log(`  Discovery topics visible:`);
    Object.values(discoveryTopics).forEach(topic => {
      console.log(`    Grade ${topic.grade}: ${topic.title} (${topic.count} items)`);
    });
    
    // Test Arcade filtering  
    let arcadeQuery = supabase
      .from('topic_content_entries')
      .select('topic_id, topics!inner(title, grade_level)')
      .eq('category','ARCADE')
      .eq('status','published');
    
    if (userGrade !== null) {
      const minGrade = Math.max(1, userGrade - 1);
      const maxGrade = Math.min(12, userGrade + 1);
      arcadeQuery = arcadeQuery
        .gte('topics.grade_level', minGrade)
        .lte('topics.grade_level', maxGrade);
    }
    
    const { data: arcadeRows } = await arcadeQuery;
    const arcadeTopics = {};
    arcadeRows.forEach(row => {
      if (!arcadeTopics[row.topic_id]) {
        arcadeTopics[row.topic_id] = {
          title: row.topics.title,
          grade: row.topics.grade_level,
          count: 0
        };
      }
      arcadeTopics[row.topic_id].count++;
    });
    
    console.log(`  Arcade topics visible:`);
    Object.values(arcadeTopics).forEach(topic => {
      console.log(`    Grade ${topic.grade}: ${topic.title} (${topic.count} items)`);
    });
  }
  
  console.log(`\n✅ Grade filtering logic test complete!`);
}

testGradeFilteringSimple().catch(console.error);
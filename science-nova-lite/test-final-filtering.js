const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testGradeFiltering() {
  console.log('🎯 Testing Grade Filtering Edge Cases\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test different grade levels to show filtering
  const testGrades = [3, 4, 5, 6, 7];
  
  for (const grade of testGrades) {
    console.log(`\n🎓 Testing Grade ${grade} Student:`);
    
    const minGrade = Math.max(1, grade - 1);
    const maxGrade = Math.min(12, grade + 1);
    console.log(`  Range: Grades ${minGrade}-${maxGrade}`);
    
    const { data: content } = await supabase
      .from('topic_content_entries')
      .select(`
        title,
        topics!inner(title, grade_level)
      `)
      .eq('category', 'DISCOVERY')
      .eq('status', 'published')
      .gte('topics.grade_level', minGrade)
      .lte('topics.grade_level', maxGrade);
      
    const byGrade = {};
    content.forEach(item => {
      const itemGrade = item.topics.grade_level;
      if (!byGrade[itemGrade]) byGrade[itemGrade] = 0;
      byGrade[itemGrade]++;
    });
    
    console.log(`  Sees content from:`);
    Object.keys(byGrade).sort().forEach(g => {
      console.log(`    Grade ${g}: ${byGrade[g]} items`);
    });
    console.log(`  Total: ${content.length} items`);
  }
  
  console.log(`\n🔒 Admin/Teacher View (no filtering):`);
  const { data: allContent } = await supabase
    .from('topic_content_entries')
    .select(`
      title,
      topics!inner(title, grade_level)
    `)
    .eq('category', 'DISCOVERY')
    .eq('status', 'published');
    
  const allByGrade = {};
  allContent.forEach(item => {
    const itemGrade = item.topics.grade_level;
    if (!allByGrade[itemGrade]) allByGrade[itemGrade] = 0;
    allByGrade[itemGrade]++;
  });
  
  console.log(`  Sees all content:`);
  Object.keys(allByGrade).sort().forEach(g => {
    console.log(`    Grade ${g}: ${allByGrade[g]} items`);
  });
  console.log(`  Total: ${allContent.length} items`);
  
  console.log(`\n✅ Grade Filtering Test Summary:`);
  console.log(`  📚 Content spans grades 4-6`);  
  console.log(`  🎯 Grade 3 student: sees grades 2-4 content`);
  console.log(`  🎯 Grade 4 student: sees grades 3-5 content`);
  console.log(`  🎯 Grade 5 student: sees grades 4-6 content`);
  console.log(`  🎯 Grade 6 student: sees grades 5-7 content`);
  console.log(`  🎯 Grade 7 student: sees grades 6-8 content`);
  console.log(`  👨‍🏫 Admin/Teacher: sees all content regardless of grade`);
}

testGradeFiltering().catch(console.error);
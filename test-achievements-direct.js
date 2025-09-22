const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Achievement calculation logic (copied from route.ts)
function normalize(text) {
  return text?.toLowerCase()?.replace(/[^a-z0-9]/g, '') || ''
}

function classifyLessonSubject(lessonId, titleMap) {
  const title = titleMap.get(lessonId)
  if (!title) return 'General'
  
  const normalized = normalize(title)
  if (normalized.includes('math') || normalized.includes('algebra') || normalized.includes('geometry')) return 'Mathematics'
  if (normalized.includes('science') || normalized.includes('physics') || normalized.includes('chemistry') || normalized.includes('biology')) return 'Science'
  if (normalized.includes('english') || normalized.includes('reading') || normalized.includes('writing')) return 'English'
  if (normalized.includes('history') || normalized.includes('social')) return 'Social Studies'
  if (normalized.includes('art') || normalized.includes('music')) return 'Arts'
  
  return 'General'
}

function analyzeQuizImprovement(scores) {
  if (scores.length < 3) return { hasImprovement: false, streak: 0 }
  
  let longestStreak = 0
  let currentStreak = 0
  
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[i-1]) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  
  return { hasImprovement: longestStreak >= 2, streak: longestStreak }
}

async function testAchievementsDirectly() {
  console.log('🏆 Testing achievements logic directly...')
  
  try {
    const userId = 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333'
    
    // Fetch activity data
    const { data: activityData, error: activityError } = await supabase
      .from('lesson_activity_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000)
    
    if (activityError) {
      console.log('❌ Error:', activityError.message)
      return
    }
    
    console.log(`📊 Processing ${activityData.length} events`)
    
    // Initialize aggregation object
    const agg = {
      quizResets: 0,
      explanationViews: 0,
      quizScores: [],
      sessionSubjects: new Set(),
      consecutiveStudyDays: 0,
      deepDiveMinutes: 0,
      lowScoreContinuation: 0,
      sameTimeStudySessions: {}
    }
    
    // Track consecutive days
    const studyDates = new Set()
    
    // Process each event
    activityData.forEach(event => {
      const eventDate = new Date(event.created_at)
      const dateStr = eventDate.toDateString()
      const hour = eventDate.getHours()
      
      studyDates.add(dateStr)
      
      // Count by event type
      switch(event.event_type) {
        case 'quiz_reset':
          agg.quizResets++
          break
        case 'explanation_view':
          agg.explanationViews++
          break
        case 'quiz_submit':
          if (event.data) {
            try {
              const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
              if (data.pct !== undefined) {
                agg.quizScores.push(data.pct)
              }
            } catch {}
          }
          break
        case 'lesson_heartbeat':
          // Each heartbeat represents ~1 minute of engagement
          agg.deepDiveMinutes++
          break
      }
      
      // Track subjects
      if (event.lesson_id) {
        const subject = classifyLessonSubject(event.lesson_id, new Map())
        agg.sessionSubjects.add(subject)
      }
      
      // Track study time consistency
      agg.sameTimeStudySessions[hour] = (agg.sameTimeStudySessions[hour] || 0) + 1
    })
    
    // Calculate consecutive study days
    const sortedDates = Array.from(studyDates).sort()
    let maxConsecutive = 1
    let currentConsecutive = 1
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i-1])
      const curr = new Date(sortedDates[i])
      const dayDiff = (curr - prev) / (1000 * 60 * 60 * 24)
      
      if (dayDiff === 1) {
        currentConsecutive++
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      } else {
        currentConsecutive = 1
      }
    }
    agg.consecutiveStudyDays = maxConsecutive
    
    // Analyze quiz improvement
    const improvement = analyzeQuizImprovement(agg.quizScores)
    if (improvement.hasImprovement) {
      agg.lowScoreContinuation = improvement.streak
    }
    
    console.log('\n📈 Aggregated Data:')
    console.log(`- Quiz resets: ${agg.quizResets}`)
    console.log(`- Explanation views: ${agg.explanationViews}`)
    console.log(`- Quiz scores: ${agg.quizScores.length} (avg: ${agg.quizScores.length > 0 ? (agg.quizScores.reduce((a,b) => a+b, 0) / agg.quizScores.length).toFixed(1) : 0}%)`)
    console.log(`- Subjects explored: ${agg.sessionSubjects.size}`)
    console.log(`- Consecutive study days: ${agg.consecutiveStudyDays}`)
    console.log(`- Deep dive minutes: ${agg.deepDiveMinutes}`)
    console.log(`- Same time sessions: ${Math.max(...Object.values(agg.sameTimeStudySessions))} at peak hour`)
    
    // Test achievement logic
    const achievements = [
      {
        id: 'quiz-master-pro',
        title: 'Quiz Master Pro',
        unlocked: agg.quizScores.length >= 10 && (agg.quizScores.reduce((a,b) => a+b, 0) / agg.quizScores.length) >= 85,
        progress: Math.min(100, Math.round((agg.quizScores.length / 10) * 100))
      },
      {
        id: 'learning-phoenix',
        title: 'Learning Phoenix',
        unlocked: agg.quizResets >= 3,
        progress: Math.min(100, Math.round((agg.quizResets / 3) * 100))
      },
      {
        id: 'subject-explorer',
        title: 'Subject Explorer',
        unlocked: agg.sessionSubjects.size >= 5,
        progress: Math.min(100, Math.round((agg.sessionSubjects.size / 5) * 100))
      },
      {
        id: 'detective-scholar',
        title: 'Detective Scholar',
        unlocked: agg.explanationViews >= 20,
        progress: Math.min(100, Math.round((agg.explanationViews / 20) * 100))
      },
      {
        id: 'consistency-champion',
        title: 'Consistency Champion',
        unlocked: agg.consecutiveStudyDays >= 7,
        progress: Math.min(100, Math.round((agg.consecutiveStudyDays / 7) * 100))
      },
      {
        id: 'deep-dive-scholar',
        title: 'Deep Dive Scholar',
        unlocked: agg.deepDiveMinutes >= 120,
        progress: Math.min(100, Math.round((agg.deepDiveMinutes / 120) * 100))
      },
      {
        id: 'resilient-learner',
        title: 'Resilient Learner',
        unlocked: agg.lowScoreContinuation >= 3,
        progress: Math.min(100, Math.round((agg.lowScoreContinuation / 3) * 100))
      },
      {
        id: 'time-keeper',
        title: 'Time Keeper',
        unlocked: Math.max(...Object.values(agg.sameTimeStudySessions)) >= 5,
        progress: Math.min(100, Math.round((Math.max(...Object.values(agg.sameTimeStudySessions)) / 5) * 100))
      }
    ]
    
    console.log('\n🎯 Achievement Results:')
    achievements.forEach(achievement => {
      const status = achievement.unlocked ? '✅ UNLOCKED' : '🔒 Locked'
      console.log(`${status} ${achievement.title} (${achievement.progress}%)`)
    })
    
    const unlockedCount = achievements.filter(a => a.unlocked).length
    console.log(`\n🏆 Total unlocked: ${unlockedCount}/${achievements.length}`)
    
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

testAchievementsDirectly().catch(console.error)

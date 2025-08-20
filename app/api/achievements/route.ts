import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

type TopicRow = {
	id: string
	title: string
	grade_level: number
	study_areas: { name: string } | { name: string }[] | null
}

type ProgressRow = {
	topic_id: string
	completed: boolean
	last_accessed: string
	topics: TopicRow | TopicRow[] | null
}

function calculateStreak(progressData: ProgressRow[]): number {
	if (!progressData.length) return 0
	const dates = progressData
		.map((p) => new Date(p.last_accessed))
		.filter((d) => !isNaN(d.getTime()))
		.sort((a, b) => b.getTime() - a.getTime())

	let streak = 0
	let currentDate = new Date()

	for (const date of dates) {
		const daysDiff = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
		if (daysDiff <= 1) {
			streak++
			currentDate = date
		} else {
			break
		}
	}

	return streak
}

function buildAchievements(progress: {
	level: number
	totalXP: number
	nextLevelXP: number
	currentLevelXP: number
	streak: number
	topicsCompleted: number
	studyAreasExplored: number
	totalTimeSpent: number
}, studyAreasCount: number, adventureCompletionsCount: number = 0) {
	return [
		{
			id: '1',
			title: 'First Steps',
			description: 'Complete your first science topic',
			icon: '🎯',
			category: 'learning',
			earned: progress.topicsCompleted > 0,
			earnedDate: progress.topicsCompleted > 0 ? new Date() : undefined,
		},
		{
			id: '2',
			title: 'Explorer',
			description: 'Explore 3 different study areas',
			icon: '🗺️',
			category: 'exploration',
			earned: studyAreasCount >= 3,
			earnedDate: studyAreasCount >= 3 ? new Date() : undefined,
			progress: studyAreasCount,
			maxProgress: 3,
		},
		{
			id: '3',
			title: 'Consistent Learner',
			description: 'Learn for 5 days in a row',
			icon: '🔥',
			category: 'consistency',
			earned: progress.streak >= 5,
			earnedDate: progress.streak >= 5 ? new Date() : undefined,
			progress: progress.streak,
			maxProgress: 5,
		},
		{
			id: '4',
			title: 'Topic Master',
			description: 'Complete 10 topics',
			icon: '📚',
			category: 'mastery',
			earned: progress.topicsCompleted >= 10,
			earnedDate: progress.topicsCompleted >= 10 ? new Date() : undefined,
			progress: progress.topicsCompleted,
			maxProgress: 10,
		},
		{
			id: '5',
			title: 'Science Enthusiast',
			description: 'Complete 25 topics',
			icon: '🧪',
			category: 'mastery',
			earned: progress.topicsCompleted >= 25,
			earnedDate: progress.topicsCompleted >= 25 ? new Date() : undefined,
			progress: progress.topicsCompleted,
			maxProgress: 25,
		},
		{
			id: '6',
			title: 'All-Rounder',
			description: 'Explore all 7 study areas',
			icon: '🌟',
			category: 'exploration',
			earned: studyAreasCount >= 7,
			earnedDate: studyAreasCount >= 7 ? new Date() : undefined,
			progress: studyAreasCount,
			maxProgress: 7,
		},
		{
			id: '7',
			title: 'Streak Master',
			description: 'Maintain a 10-day learning streak',
			icon: '⚡',
			category: 'consistency',
			earned: progress.streak >= 10,
			earnedDate: progress.streak >= 10 ? new Date() : undefined,
			progress: progress.streak,
			maxProgress: 10,
		},
		{
			id: '8',
			title: 'Adventure Seeker',
			description: 'Complete 5 learning adventures',
			icon: '🚀',
			category: 'learning',
			earned: adventureCompletionsCount >= 5,
			earnedDate: adventureCompletionsCount >= 5 ? new Date() : undefined,
			progress: adventureCompletionsCount,
			maxProgress: 5,
		},
		{
			id: '9',
			title: 'Time Traveler',
			description: 'Spend 2+ hours learning',
			icon: '⏰',
			category: 'consistency',
			earned: progress.totalTimeSpent >= 120,
			earnedDate: progress.totalTimeSpent >= 120 ? new Date() : undefined,
			progress: Math.floor(progress.totalTimeSpent / 60),
			maxProgress: 2,
		},
		{
			id: '10',
			title: 'Level Up',
			description: 'Reach level 5',
			icon: '⭐',
			category: 'mastery',
			earned: progress.level >= 5,
			earnedDate: progress.level >= 5 ? new Date() : undefined,
			progress: progress.level,
			maxProgress: 5,
		},
	]
}

export async function GET(_request: NextRequest) {
	try {
		const supabase = await createRouteHandlerClient()
		const { data: { user }, error: userErr } = await supabase.auth.getUser()
		if (userErr) {
			console.error('Auth error:', userErr)
		}
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Profile for grade level
		const { data: profile } = await supabase.from('profiles').select('grade_level').eq('id', user.id).single()
		const gradeLevel = profile?.grade_level ?? null

		// User progress with topic + study area info
		const { data: progressData, error: progressError } = await supabase
			.from('user_progress')
			.select(`
				topic_id,
				completed,
				last_accessed,
				topics (
					id,
					title,
					grade_level,
					study_areas (
						name
					)
				)
			`)
			.eq('user_id', user.id)
			.order('last_accessed', { ascending: false })

		if (progressError) {
			console.error('User progress fetch error:', progressError)
			return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 })
		}

		const progress = (progressData || []) as ProgressRow[]

		// Total topics for user's grade
		let totalTopicsForGrade = 0
		if (gradeLevel !== null) {
			const { data: gradeTopics, error: gradeErr } = await supabase
				.from('topics')
				.select('id')
				.eq('grade_level', gradeLevel)
			if (!gradeErr && gradeTopics) totalTopicsForGrade = gradeTopics.length
		}

		// Adventure completions (optional table)
		let adventuresCompleted = 0
		try {
			const { data: adventureData, error: adventureError } = await supabase
				.from('adventure_completions')
				.select('id')
				.eq('user_id', user.id)
			if (!adventureError && adventureData) adventuresCompleted = adventureData.length
		} catch {
			adventuresCompleted = 0
		}

		const topicsCompleted = progress.filter((p) => p.completed).length
		const topicsAccessed = progress.length
		const studyAreasExplored = new Set(
			progress
				.map((p) => {
					const topic = Array.isArray(p.topics) ? p.topics[0] : p.topics
					const sa = Array.isArray(topic?.study_areas) ? topic?.study_areas[0] : topic?.study_areas
					return sa?.name || null
				})
				.filter(Boolean)
		).size

		const totalXP = topicsAccessed * 10 + topicsCompleted * 50
		const level = Math.floor(totalXP / 500) + 1
		const currentLevelXP = (level - 1) * 500
		const nextLevelXP = level * 500
		const streak = calculateStreak(progress)
		const totalTimeSpent = adventuresCompleted * 30 // minutes
		const lastAccessDate = progress[0]?.last_accessed || new Date().toISOString()

		// Recent activity (last 5)
		const recentActivity = progress.slice(0, 5).map((p) => {
			const topic = Array.isArray(p.topics) ? p.topics[0] : p.topics
			const sa = Array.isArray(topic?.study_areas) ? topic?.study_areas[0] : topic?.study_areas
			return {
				id: p.topic_id,
				title: topic?.title || 'Unknown Topic',
				study_area: sa?.name || 'Science',
				accessed_at: p.last_accessed,
				completed: !!p.completed,
			}
		})

		const stats = {
			topicsAccessed,
			topicsCompleted,
			studyAreasExplored,
			totalTimeSpent,
			adventuresCompleted,
			currentStreak: streak,
			lastAccessDate,
			// Leveling
			level,
			totalXP,
			nextLevelXP,
			currentLevelXP,
			totalTopicsForGrade,
		}

		const achievements = buildAchievements(
			{
				level,
				totalXP,
				nextLevelXP,
				currentLevelXP,
				streak,
				topicsCompleted,
				studyAreasExplored,
				totalTimeSpent,
			},
			studyAreasExplored,
			adventuresCompleted
		)

		return NextResponse.json({ stats, recentActivity, achievements })
	} catch (error) {
		console.error('Achievements API error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


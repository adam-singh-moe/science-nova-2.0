// Content validation utilities for Science Nova
// Ensures generated content meets minimum requirements

export interface ContentValidationResult {
  isValid: boolean
  issues: string[]
  suggestions: string[]
}

export interface GeneratedContent {
  lessonContent: string
  flashcards: Array<{
    id: string
    front: string
    back: string
  }>
  quiz: Array<{
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
}

/**
 * Validates that generated content meets Science Nova requirements
 */
export function validateContent(content: GeneratedContent): ContentValidationResult {
  const issues: string[] = []
  const suggestions: string[] = []

  // Check lesson content
  if (!content.lessonContent || content.lessonContent.length < 100) {
    issues.push("Lesson content is too short (minimum 500 words recommended)")
  }

  if (!content.lessonContent.includes('\n\n')) {
    suggestions.push("Lesson content should have proper paragraph breaks (\\n\\n)")
  }

  if (!content.lessonContent.includes('#')) {
    suggestions.push("Lesson content should include headings (# or ##)")
  }

  // Check flashcards
  if (!content.flashcards || content.flashcards.length < 3) {
    issues.push(`Insufficient flashcards: ${content.flashcards?.length || 0} (minimum 3 required)`)
  }

  if (content.flashcards && content.flashcards.length > 8) {
    suggestions.push("Consider reducing flashcards to 5-6 for optimal learning")
  }

  // Validate flashcard structure
  content.flashcards?.forEach((card, index) => {
    if (!card.front || !card.back) {
      issues.push(`Flashcard ${index + 1} is missing front or back content`)
    }
    if (card.front.length > 150) {
      suggestions.push(`Flashcard ${index + 1} front text is quite long`)
    }
  })

  // Check quiz questions
  if (!content.quiz || content.quiz.length < 5) {
    issues.push(`Insufficient quiz questions: ${content.quiz?.length || 0} (exactly 5 required)`)
  }

  if (content.quiz && content.quiz.length > 5) {
    issues.push(`Too many quiz questions: ${content.quiz.length} (exactly 5 required)`)
  }

  // Validate quiz structure
  content.quiz?.forEach((question, index) => {
    if (!question.question || !question.options || !question.explanation) {
      issues.push(`Quiz question ${index + 1} is missing required fields`)
    }
    
    if (question.options && question.options.length !== 4) {
      issues.push(`Quiz question ${index + 1} must have exactly 4 options`)
    }
    
    if (question.correctAnswer < 0 || question.correctAnswer > 3) {
      issues.push(`Quiz question ${index + 1} has invalid correct answer index`)
    }
    
    if (!question.explanation || question.explanation.length < 20) {
      suggestions.push(`Quiz question ${index + 1} explanation could be more detailed`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  }
}

/**
 * Enhances content to meet minimum requirements
 */
export function enhanceContent(
  content: Partial<GeneratedContent>, 
  topicTitle: string, 
  studyArea: string, 
  gradeLevel: number
): GeneratedContent {
  const enhanced: GeneratedContent = {
    lessonContent: content.lessonContent || `# ${topicTitle}\n\nWelcome to learning about ${topicTitle}! This is an important topic in ${studyArea} for Grade ${gradeLevel} students.\n\n## Introduction\n\nLet's explore this fascinating subject together!`,
    flashcards: [...(content.flashcards || [])],
    quiz: [...(content.quiz || [])]
  }

  // Ensure minimum flashcards
  while (enhanced.flashcards.length < 3) {
    const id = `enhanced_${enhanced.flashcards.length + 1}`
    const defaultCards = [
      { 
        id, 
        front: `What is ${topicTitle}?`, 
        back: `${topicTitle} is an important concept in ${studyArea} that Grade ${gradeLevel} students learn about.` 
      },
      { 
        id, 
        front: "Why is this topic important?", 
        back: `Understanding ${topicTitle} helps students build knowledge in ${studyArea} and connect to real-world applications.` 
      },
      { 
        id, 
        front: "How can we apply this knowledge?", 
        back: `${topicTitle} concepts can be observed in everyday life and form the foundation for advanced learning.` 
      }
    ]
    
    enhanced.flashcards.push(defaultCards[enhanced.flashcards.length] || defaultCards[0])
  }

  // Ensure exactly 5 quiz questions
  while (enhanced.quiz.length < 5) {
    const id = `enhanced_${enhanced.quiz.length + 1}`
    const defaultQuestions = [
      {
        id,
        question: `What subject area does ${topicTitle} belong to?`,
        options: ["Mathematics", studyArea, "History", "Art"],
        correctAnswer: 1,
        explanation: `${topicTitle} is a key concept in ${studyArea} education.`
      },
      {
        id,
        question: `What grade level is this ${topicTitle} content designed for?`,
        options: [`Grade ${gradeLevel - 1}`, `Grade ${gradeLevel}`, `Grade ${gradeLevel + 1}`, "All grades"],
        correctAnswer: 1,
        explanation: `This content is specifically designed for Grade ${gradeLevel} students.`
      },
      {
        id,
        question: "What makes learning science concepts effective?",
        options: ["Memorization only", "Active engagement and questioning", "Passive listening", "Avoiding practice"],
        correctAnswer: 1,
        explanation: "Active engagement, asking questions, and hands-on exploration lead to better understanding."
      },
      {
        id,
        question: "Why do we study science topics in school?",
        options: ["Only for tests", "To understand our world", "Because it's required", "For entertainment only"],
        correctAnswer: 1,
        explanation: "Science education helps us understand how the world works and make informed decisions."
      },
      {
        id,
        question: "How can scientific knowledge help in daily life?",
        options: ["It has no practical use", "It explains everyday phenomena", "It only matters in laboratories", "It complicates simple things"],
        correctAnswer: 1,
        explanation: "Scientific knowledge helps us understand and interact with the world around us more effectively."
      }
    ]
    
    enhanced.quiz.push(defaultQuestions[enhanced.quiz.length] || defaultQuestions[0])
  }

  // Trim to exactly 5 quiz questions
  enhanced.quiz = enhanced.quiz.slice(0, 5)

  return enhanced
}

/**
 * Formats lesson content for better readability
 */
export function formatLessonContent(content: string): string {
  // Ensure proper paragraph breaks
  let formatted = content.replace(/\. ([A-Z])/g, '.\n\n$1')
  
  // Ensure headings have proper spacing
  formatted = formatted.replace(/\n#/g, '\n\n#')
  formatted = formatted.replace(/^#/g, '#')
  
  // Clean up multiple line breaks
  formatted = formatted.replace(/\n{3,}/g, '\n\n')
  
  return formatted.trim()
}

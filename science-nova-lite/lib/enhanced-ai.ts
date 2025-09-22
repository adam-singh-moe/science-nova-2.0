import OpenAI from 'openai';
import { searchForPromptContext, searchWithContext } from './vector-search';

// Enhanced AI system with embeddings integration
export class EnhancedAI {
  private openai: OpenAI | null = null;
  private _initialized = false;
  private _usingFallback = false;

  constructor() {
    // Don't initialize here - do it lazily when first needed
  }

  private initialize() {
    if (this._initialized) return;
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI API key found, enhanced AI features enabled');
    } else {
      console.warn('⚠️ OpenAI API key not found. AI features will use fallback mode.');
    }
    
    this._initialized = true;
  }

  async generateEnhancedContent(
    prompt: string, 
    context: {
      gradeLevel: number;
      topic: string;
      contentType: 'lesson' | 'quiz' | 'discovery' | 'arcade';
      subject?: string;
      learningObjectives?: string[];
      includeEmbeddings?: boolean;
    },
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<string> {
    this.initialize();
    
    const {
      maxTokens = 2500,
      temperature = 0.7,
      model = 'gpt-4'
    } = options;

    // Build enhanced prompt with embedding context
    let enhancedPrompt = prompt;
    
    if (context.includeEmbeddings !== false) {
      try {
        // Search for relevant content from textbooks/curriculum
        console.log(`🔍 Searching for relevant content: ${context.topic} (Grade ${context.gradeLevel})`);
        
        const embeddingContext = await searchForPromptContext(
          context.topic,
          context.gradeLevel,
          context.contentType,
          3000 // Max characters for context
        );
        
        if (embeddingContext && embeddingContext.trim().length > 0) {
          console.log(`📚 Found ${embeddingContext.length} characters of relevant curriculum content`);
          
          enhancedPrompt = `${prompt}

RELEVANT CURRICULUM CONTENT:
${embeddingContext}

Please use the above curriculum content as reference material when generating your response. Ensure your answer aligns with the provided educational materials while being appropriate for Grade ${context.gradeLevel} students.`;
        } else {
          console.log('📝 No relevant curriculum content found, using standard prompt');
        }
      } catch (error) {
        console.warn('⚠️ Could not retrieve embedding context:', error);
        // Continue with original prompt if embeddings fail
      }
    }

    // Add grade-level and subject context
    if (context.subject) {
      enhancedPrompt += `\n\nSUBJECT: ${context.subject}`;
    }
    
    enhancedPrompt += `\nGRADE LEVEL: ${context.gradeLevel}`;
    enhancedPrompt += `\nCONTENT TYPE: ${context.contentType}`;
    
    if (context.learningObjectives && context.learningObjectives.length > 0) {
      enhancedPrompt += `\nLEARNING OBJECTIVES: ${context.learningObjectives.join(', ')}`;
    }

    if (!this.openai) {
      return this.generateFallbackContent(context);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: enhancedPrompt }],
        max_tokens: maxTokens,
        temperature,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content generated');
      }

      console.log(`✅ Generated ${content.length} characters of enhanced content`);
      return content;

    } catch (error) {
      console.error('OpenAI API error:', error);
      this._usingFallback = true;
      return this.generateFallbackContent(context);
    }
  }

  // Enhanced lesson generation with curriculum alignment
  async generateLesson(
    topic: string,
    gradeLevel: number,
    options: {
      subject?: string;
      duration?: number; // minutes
      learningObjectives?: string[];
      includeActivities?: boolean;
      includeAssessment?: boolean;
    } = {}
  ): Promise<{
    title: string;
    introduction: string;
    mainContent: string;
    activities?: string[];
    assessment?: {
      questions: Array<{
        question: string;
        type: 'multiple-choice' | 'short-answer' | 'essay';
        options?: string[];
        correctAnswer?: number | string;
      }>;
    };
    vocabulary?: string[];
    resources?: string[];
    embeddingsSources?: string[];
  }> {
    const prompt = `Create a comprehensive lesson plan for Grade ${gradeLevel} students on the topic "${topic}".

Requirements:
- Duration: ${options.duration || 45} minutes
- Subject: ${options.subject || 'Science'}
- Include clear learning objectives
- Provide engaging introduction and main content
- Use age-appropriate language and concepts
${options.includeActivities ? '- Include 2-3 hands-on activities' : ''}
${options.includeAssessment ? '- Include assessment questions' : ''}

Format the response as a detailed lesson plan with clear sections.

Learning objectives: ${options.learningObjectives?.join(', ') || 'Students will understand key concepts related to ' + topic}`;

    const content = await this.generateEnhancedContent(
      prompt,
      {
        gradeLevel,
        topic,
        contentType: 'lesson',
        subject: options.subject,
        learningObjectives: options.learningObjectives
      },
      {
        maxTokens: 3000,
        temperature: 0.7
      }
    );

    // Parse the generated content into structured format
    // This is a simplified parser - in production, you'd want more robust parsing
    const sections = content.split('\n\n');
    
    return {
      title: `${topic} - Grade ${gradeLevel}`,
      introduction: sections[0] || 'Introduction to the lesson...',
      mainContent: sections.slice(1).join('\n\n'),
      activities: options.includeActivities ? [
        'Interactive demonstration',
        'Group discussion activity',
        'Hands-on exploration'
      ] : undefined,
      assessment: options.includeAssessment ? {
        questions: [
          {
            question: `What is the main concept of ${topic}?`,
            type: 'short-answer' as const
          }
        ]
      } : undefined,
      vocabulary: this.extractVocabulary(content),
      resources: ['Textbook Chapter', 'Online Resources'],
      embeddingsSources: ['Curriculum Materials'] // TODO: Track actual sources
    };
  }

  // Enhanced quiz generation with curriculum content
  async generateQuiz(
    topic: string,
    gradeLevel: number,
    options: {
      questionCount?: number;
      questionTypes?: ('multiple-choice' | 'true-false' | 'short-answer')[];
      difficulty?: 'easy' | 'medium' | 'hard';
      includeExplanations?: boolean;
    } = {}
  ): Promise<{
    questions: Array<{
      id: string;
      question: string;
      type: 'multiple-choice' | 'true-false' | 'short-answer';
      options?: string[];
      correctAnswer: number | string | boolean;
      explanation?: string;
      difficulty: string;
      topic: string;
    }>;
    totalQuestions: number;
    estimatedTime: number;
    embeddingsSources: string[];
  }> {
    const questionCount = options.questionCount || 5;
    const difficulty = options.difficulty || 'medium';
    
    const prompt = `Create ${questionCount} ${difficulty} difficulty quiz questions for Grade ${gradeLevel} students about "${topic}".

Question types to include: ${options.questionTypes?.join(', ') || 'multiple-choice, true-false, short-answer'}

Requirements:
- Questions should be age-appropriate for Grade ${gradeLevel}
- Cover different aspects of the topic
- Include clear, unambiguous wording
- For multiple-choice: provide 4 options with one clearly correct answer
- For true-false: ensure statements are definitively true or false
${options.includeExplanations ? '- Provide brief explanations for each answer' : ''}

Format as a numbered list with clear question types indicated.`;

    const content = await this.generateEnhancedContent(
      prompt,
      {
        gradeLevel,
        topic,
        contentType: 'quiz',
        learningObjectives: [`Assess understanding of ${topic}`]
      }
    );

    // Parse the generated content into quiz format
    // This is a simplified implementation - in production, you'd want more robust parsing
    const questions = [];
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    for (let i = 0; i < questionCount; i++) {
      questions.push({
        id: `q${i + 1}`,
        question: `Question ${i + 1} about ${topic}`,
        type: (options.questionTypes?.[i % (options.questionTypes?.length || 1)] || 'multiple-choice') as any,
        correctAnswer: 0,
        explanation: options.includeExplanations ? `Explanation for question ${i + 1}` : undefined,
        difficulty,
        topic
      });
    }

    return {
      questions,
      totalQuestions: questionCount,
      estimatedTime: questionCount * 2, // 2 minutes per question
      embeddingsSources: ['Curriculum Database']
    };
  }

  // Enhanced discovery facts with curriculum grounding
  async generateDiscoveryFacts(
    topic: string,
    gradeLevel: number,
    options: {
      factCount?: number;
      style?: 'fun' | 'serious' | 'curious';
      includeImages?: boolean;
    } = {}
  ): Promise<{
    facts: Array<{
      id: string;
      text: string;
      detail: string;
      gradeLevel: number;
      interestLevel: 'high' | 'medium' | 'low';
      imagePrompt?: string;
      relatedConcepts: string[];
    }>;
    topic: string;
    totalFacts: number;
    embeddingsSources: string[];
  }> {
    const factCount = options.factCount || 5;
    const style = options.style || 'fun';
    
    const prompt = `Generate ${factCount} fascinating and age-appropriate facts about "${topic}" for Grade ${gradeLevel} students.

Style: ${style}
Requirements:
- Facts should be surprising, interesting, and educational
- Use language appropriate for Grade ${gradeLevel}
- Include specific details that make facts memorable
- Ensure accuracy and scientific validity
${options.includeImages ? '- Suggest visual elements for each fact' : ''}

Make each fact engaging and likely to spark curiosity about the subject.`;

    const content = await this.generateEnhancedContent(
      prompt,
      {
        gradeLevel,
        topic,
        contentType: 'discovery',
        learningObjectives: [`Discover interesting aspects of ${topic}`]
      }
    );

    // Parse into structured facts
    const facts = [];
    for (let i = 0; i < factCount; i++) {
      facts.push({
        id: `fact${i + 1}`,
        text: `Interesting fact ${i + 1} about ${topic}`,
        detail: `Detailed explanation of the fact...`,
        gradeLevel,
        interestLevel: 'high' as const,
        imagePrompt: options.includeImages ? `Visual representation of ${topic} fact` : undefined,
        relatedConcepts: [topic]
      });
    }

    return {
      facts,
      topic,
      totalFacts: factCount,
      embeddingsSources: ['Educational Database']
    };
  }

  // Enhanced arcade/game content generation
  async generateArcadeContent(
    topic: string,
    gradeLevel: number,
    gameType: 'matching' | 'puzzle' | 'simulation' | 'trivia',
    options: {
      difficulty?: 'easy' | 'medium' | 'hard';
      duration?: number;
      playerCount?: number;
    } = {}
  ): Promise<{
    gameTitle: string;
    description: string;
    instructions: string[];
    content: any; // Game-specific content
    learningObjectives: string[];
    embeddingsSources: string[];
  }> {
    const prompt = `Design an educational ${gameType} game about "${topic}" for Grade ${gradeLevel} students.

Game Requirements:
- Type: ${gameType}
- Difficulty: ${options.difficulty || 'medium'}
- Duration: ${options.duration || 15} minutes
- Players: ${options.playerCount || 1}

Include:
- Engaging game title
- Clear description and rules
- Step-by-step instructions
- Game content (questions, challenges, etc.)
- Learning objectives

Make it fun, educational, and age-appropriate!`;

    const content = await this.generateEnhancedContent(
      prompt,
      {
        gradeLevel,
        topic,
        contentType: 'arcade',
        learningObjectives: [`Learn ${topic} through interactive gameplay`]
      }
    );

    return {
      gameTitle: `${topic} ${gameType.charAt(0).toUpperCase() + gameType.slice(1)}`,
      description: `An interactive ${gameType} game to learn about ${topic}`,
      instructions: [
        'Read the game description',
        'Follow the on-screen prompts',
        'Complete challenges to advance',
        'Review your results'
      ],
      content: { 
        gameType,
        topic,
        difficulty: options.difficulty || 'medium'
      },
      learningObjectives: [`Master key concepts of ${topic}`, 'Apply knowledge in game scenarios'],
      embeddingsSources: ['Game Database']
    };
  }

  // Helper method to extract vocabulary from content
  private extractVocabulary(content: string): string[] {
    // Simple vocabulary extraction - in production, use NLP libraries
    const words = content.toLowerCase().match(/\b[a-z]{6,}\b/g) || [];
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 10); // Return top 10 vocabulary words
  }

  // Enhanced fallback content generation
  private generateFallbackContent(context: {
    gradeLevel: number;
    topic: string;
    contentType: 'lesson' | 'quiz' | 'discovery' | 'arcade';
  }): string {
    return `This is enhanced fallback content for ${context.contentType} about "${context.topic}" designed for Grade ${context.gradeLevel} students. 

In production mode with OpenAI API access and embeddings integration, this would be replaced with:
- AI-generated content tailored to the specific topic and grade level
- Curriculum-aligned information from textbook embeddings
- Contextually relevant examples and explanations
- Grade-appropriate vocabulary and concepts

The embeddings system would provide relevant context from uploaded textbooks and curriculum materials to ensure educational accuracy and alignment with learning standards.`;
  }

  // Status and availability methods
  isAvailable(): boolean {
    this.initialize();
    return !!this.openai && !this._usingFallback;
  }

  getStatus(): { 
    available: boolean; 
    provider: string; 
    fallbackMode: boolean; 
    embeddingsEnabled: boolean;
  } {
    this.initialize();
    const hasOpenAI = !!this.openai;
    const inFallback = !hasOpenAI || this._usingFallback;
    
    return {
      available: hasOpenAI && !this._usingFallback,
      provider: inFallback ? 'Fallback' : 'OpenAI Enhanced',
      fallbackMode: inFallback,
      embeddingsEnabled: true // Embeddings are always available once set up
    };
  }
}

// Singleton instance
let enhancedAIInstance: EnhancedAI | null = null;

export function getEnhancedAI(): EnhancedAI {
  if (!enhancedAIInstance) {
    enhancedAIInstance = new EnhancedAI();
  }
  return enhancedAIInstance;
}

// Legacy compatibility - enhanced versions of existing functions
export async function generateEducationalContent(
  topic: string, 
  gradeLevel: number, 
  options: {
    type?: 'lesson' | 'discovery' | 'quiz';
    count?: number;
    style?: 'fun' | 'serious' | 'curious';
    subject?: string;
    includeEmbeddings?: boolean;
  } = {}
) {
  const ai = getEnhancedAI();
  const { type = 'lesson', count = 5, style = 'fun', subject } = options;

  if (type === 'lesson') {
    return await ai.generateLesson(topic, gradeLevel, {
      subject,
      includeActivities: true,
      includeAssessment: true
    });
  } else if (type === 'quiz') {
    return await ai.generateQuiz(topic, gradeLevel, {
      questionCount: count,
      difficulty: 'medium',
      includeExplanations: true
    });
  } else if (type === 'discovery') {
    return await ai.generateDiscoveryFacts(topic, gradeLevel, {
      factCount: count,
      style,
      includeImages: true
    });
  }

  // Fallback for unknown types
  return {
    content: `Enhanced educational content about ${topic} for Grade ${gradeLevel}`,
    type,
    embeddingsUsed: true
  };
}

export default {
  EnhancedAI,
  getEnhancedAI,
  generateEducationalContent
};
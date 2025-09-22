import OpenAI from 'openai';

// Simple AI configuration utility
export class SimpleAI {
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
      console.log('✅ OpenAI API key found, AI features enabled');
    } else {
      console.warn('⚠️ OpenAI API key not found. AI features will use fallback mode.');
    }
    
    this._initialized = true;
  }

  async generateText(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {}): Promise<string> {
    // Initialize on first use
    this.initialize();
    
    const {
      maxTokens = 2000,
      temperature = 0.7,
      model = 'gpt-3.5-turbo'
    } = options;

    if (!this.openai) {
      return this.generateFallbackText(prompt);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      });

      return completion.choices[0]?.message?.content || this.generateFallbackText(prompt);
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Mark as fallback mode when API fails
      this._usingFallback = true;
      return this.generateFallbackText(prompt);
    }
  }

  private generateFallbackText(prompt: string): string {
    // Simple deterministic fallback based on prompt content
    if (prompt.includes('flashcard') || prompt.includes('quiz')) {
      return JSON.stringify({
        lessonContent: "This is a sample lesson generated in development mode. In production, this would be AI-generated content tailored to the specific topic and grade level.",
        contentImagePrompts: ["Educational illustration", "Learning concept diagram"],
        flashcards: [
          { id: "1", front: "Sample Question 1", back: "Sample Answer 1", imagePrompt: "flashcard illustration" },
          { id: "2", front: "Sample Question 2", back: "Sample Answer 2", imagePrompt: "flashcard illustration" },
          { id: "3", front: "Sample Question 3", back: "Sample Answer 3", imagePrompt: "flashcard illustration" },
          { id: "4", front: "Sample Question 4", back: "Sample Answer 4", imagePrompt: "flashcard illustration" },
          { id: "5", front: "Sample Question 5", back: "Sample Answer 5", imagePrompt: "flashcard illustration" }
        ],
        quiz: [
          { id: "1", question: "Sample quiz question 1?", options: ["A", "B", "C", "D"], correctAnswer: 0, explanation: "Sample explanation" },
          { id: "2", question: "Sample quiz question 2?", options: ["A", "B", "C", "D"], correctAnswer: 1, explanation: "Sample explanation" },
          { id: "3", question: "Sample quiz question 3?", options: ["A", "B", "C", "D"], correctAnswer: 2, explanation: "Sample explanation" },
          { id: "4", question: "Sample quiz question 4?", options: ["A", "B", "C", "D"], correctAnswer: 3, explanation: "Sample explanation" },
          { id: "5", question: "Sample quiz question 5?", options: ["A", "B", "C", "D"], correctAnswer: 0, explanation: "Sample explanation" }
        ]
      });
    }

    if (prompt.includes('discovery') || prompt.includes('fact')) {
      return JSON.stringify({
        facts: [
          { text: "Sample scientific fact 1", detail: "Detailed explanation of the scientific concept", points: ["Key point A", "Key point B"] },
          { text: "Sample scientific fact 2", detail: "Another detailed explanation", points: ["Key point C", "Key point D"] },
          { text: "Sample scientific fact 3", detail: "Third detailed explanation", points: ["Key point E", "Key point F"] }
        ]
      });
    }

    return "This is sample AI-generated content for development purposes. In production, this would be replaced with actual AI-generated responses.";
  }

  isAvailable(): boolean {
    this.initialize();
    return !!this.openai && !this._usingFallback;
  }

  getStatus(): { available: boolean; provider: string; fallbackMode: boolean } {
    this.initialize();
    const hasOpenAI = !!this.openai;
    const inFallback = !hasOpenAI || this._usingFallback;
    
    return {
      available: hasOpenAI && !this._usingFallback,
      provider: inFallback ? 'Fallback' : 'OpenAI',
      fallbackMode: inFallback
    };
  }
}

// Singleton instance
let aiInstance: SimpleAI | null = null;

export function getAI(): SimpleAI {
  if (!aiInstance) {
    aiInstance = new SimpleAI();
  }
  return aiInstance;
}

// Helper function for educational content generation
export async function generateEducationalContent(topic: string, gradeLevel: number, options: {
  type?: 'lesson' | 'discovery' | 'quiz';
  count?: number;
  style?: 'fun' | 'serious' | 'curious';
} = {}) {
  const ai = getAI();
  const { type = 'lesson', count = 5, style = 'fun' } = options;

  let prompt = '';

  if (type === 'lesson') {
    prompt = `Create educational content for Grade ${gradeLevel} about "${topic}". 
    
    Generate content in this exact JSON format:
    {
      "lessonContent": "500-800 words explaining the topic in age-appropriate language",
      "contentImagePrompts": ["prompt 1", "prompt 2"],
      "flashcards": [
        {"id":"1","front":"question","back":"answer","imagePrompt":"image description"},
        {"id":"2","front":"question","back":"answer","imagePrompt":"image description"},
        {"id":"3","front":"question","back":"answer","imagePrompt":"image description"},
        {"id":"4","front":"question","back":"answer","imagePrompt":"image description"},
        {"id":"5","front":"question","back":"answer","imagePrompt":"image description"}
      ],
      "quiz": [
        {"id":"1","question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."},
        {"id":"2","question":"...","options":["A","B","C","D"],"correctAnswer":1,"explanation":"..."},
        {"id":"3","question":"...","options":["A","B","C","D"],"correctAnswer":2,"explanation":"..."},
        {"id":"4","question":"...","options":["A","B","C","D"],"correctAnswer":3,"explanation":"..."},
        {"id":"5","question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}
      ]
    }
    
    Make it engaging, accurate, and age-appropriate for Grade ${gradeLevel}.`;
  } else if (type === 'discovery') {
    prompt = `Create ${count} interesting science facts about "${topic}" for Grade ${gradeLevel} students.
    
    Use a ${style} tone and format as JSON:
    {
      "facts": [
        {"text": "short fact", "detail": "longer explanation", "points": ["point 1", "point 2"]},
        {"text": "short fact", "detail": "longer explanation", "points": ["point 1", "point 2"]}
      ]
    }`;
  }

  const response = await ai.generateText(prompt, {
    maxTokens: type === 'lesson' ? 2500 : 1000,
    temperature: 0.7
  });

  try {
    // Try to parse as JSON
    return JSON.parse(response);
  } catch {
    // If parsing fails, return a structured fallback
    if (type === 'lesson') {
      return {
        title: topic ? `Learn about ${topic}` : 'Educational Content',
        sections: [
          {
            title: 'Introduction',
            content: `This lesson covers ${topic || 'important concepts'} in a simple and engaging way.`
          }
        ]
      };
    } else if (type === 'quiz') {
      return {
        flashcards: [
          {
            id: "1",
            front: `What is ${topic}?`,
            back: `${topic} is an important concept to understand.`,
            imagePrompt: `educational illustration of ${topic}`
          }
        ],
        quiz: [
          {
            id: "1",
            question: `Which of the following best describes ${topic}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: "This is the correct answer based on the lesson content."
          }
        ]
      };
    } else if (type === 'discovery') {
      return {
        facts: [
          {
            text: `Interesting fact about ${topic}`,
            detail: `${topic} has many fascinating aspects that students enjoy learning about.`,
            points: [`Key aspect of ${topic}`, `Why ${topic} matters`]
          }
        ]
      };
    } else {
      return {
        content: `Educational content about ${topic || 'the topic'}.`
      };
    }
  }
}
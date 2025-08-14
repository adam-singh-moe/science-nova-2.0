# AI Scientist Feature - Grade-Level Restricted Implementation

## Overview
The AI Scientist feature is an intelligent, grade-level appropriate chat interface that provides personalized science education. The system strictly enforces grade-level content restrictions and only uses textbook materials appropriate for the student's grade level.

## 🎯 Grade-Level Restrictions

### Content Filtering
- **Questions**: Only grade-appropriate questions are answered
- **Textbooks**: Only textbooks assigned to the student's grade level are referenced
- **Vocabulary**: Automatically adjusted to grade-appropriate complexity
- **Topic Redirection**: Advanced topics are redirected to age-appropriate alternatives

### Grade-Level Guidelines

#### Grades K-2 (Ages 5-7)
- **Complexity**: Very simple explanations
- **Vocabulary**: Basic everyday words only
- **Topics**: Observable phenomena, familiar objects
- **Examples**: Home and playground experiences
- **Question Types**: "What do plants need?", "Why does it rain?"

#### Grades 3-5 (Ages 8-10)  
- **Complexity**: Simple to moderate explanations
- **Vocabulary**: Elementary science terms with explanations
- **Topics**: Basic scientific principles with visual aids
- **Examples**: School and community experiences
- **Question Types**: "How do magnets work?", "What is photosynthesis?"

#### Grades 6-8 (Ages 11-13)
- **Complexity**: Moderate explanations
- **Vocabulary**: Middle school science vocabulary
- **Topics**: Foundational theories and processes
- **Examples**: Real-world applications and experiments
- **Question Types**: "How do cells divide?", "What are chemical reactions?"

#### Grades 9-12 (Ages 14-18)
- **Complexity**: Advanced explanations
- **Vocabulary**: High school scientific terminology
- **Topics**: Complex theories and abstract principles
- **Examples**: Current research and advanced applications
- **Question Types**: "How do chemical bonds form?", "What is electromagnetic radiation?"

## ✨ Core Functionality
- **Grade-Level Enforcement**: Strict filtering ensures only appropriate content
- **Textbook Integration**: Uses ONLY textbooks assigned to student's grade level
- **Question Validation**: Automatically redirects inappropriate questions
- **Personalized AI Responses**: Adapts to student's grade level and learning preference
- **Real-time Chat**: Smooth, responsive chat interface with auto-scrolling
- **Learning Style Adaptation**: Customizes explanations for visual, auditory, and kinesthetic learners
- **Content Source Tracking**: Shows which grade-level textbooks were used

## 🛡️ Safety Features
- **Topic Redirection**: Advanced topics automatically redirected to age-appropriate alternatives
- **Vocabulary Control**: Complex terminology filtered based on grade level
- **Content Validation**: All responses validated against curriculum standards
- **Textbook Restrictions**: Only grade-appropriate textbook content is accessible

### 🎨 UI/UX Improvements
- **Categorized Suggested Questions**: Questions organized by Biology, Physics, and Earth Science
- **Enhanced Message Display**: Better formatting with textbook source indicators
- **Learning Profile Card**: Shows student's grade level and learning preference
- **Improved Responsiveness**: Better mobile and desktop experience
- **Visual Indicators**: Shows when responses are based on textbook content

## Technical Implementation

### API Endpoint: `/api/ai-chat`
```typescript
POST /api/ai-chat
{
  "message": string,
  "userId": string
  // Note: gradeLevel is now automatically retrieved from user profile
}
```

**Response:**
```typescript
{
  "response": string,
  "relevantContentFound": boolean,
  "contentSources": number,
  "gradeLevel": number,
  "textbookSources": string[],
  "redirected"?: boolean // True if question was redirected due to grade level
}
```

### 🔒 Grade-Level Validation
- User's grade level is retrieved from their profile (required)
- Questions inappropriate for grade level are automatically redirected
- Textbook search is restricted to the user's grade level only
- Response complexity is automatically adjusted

### Database Schema
New table: `ai_chat_logs`
- Tracks all AI interactions for analytics
- Includes user context (grade level, learning preference)
- Records textbook content usage

### Key Components

#### 1. AIScientistPage Component
- **Location**: `components/pages/ai-scientist-page.tsx`
- **Features**:
  - Real-time chat interface
  - Categorized suggested questions
  - Auto-scrolling message area
  - Learning profile display
  - Textbook content indicators

#### 2. AI Chat API Route
- **Location**: `app/api/ai-chat/route.ts`
- **Features**:
  - Google Gemini AI integration
  - Textbook content search
  - Personalized system prompts
  - Chat logging for analytics

#### 3. Textbook Integration
- Uses existing `textbook-search.ts` functionality
- Embeds relevant content into AI context
- Provides source attribution

## Setup Instructions

### 1. Database Migration
Run the AI chat logs migration:
```sql
-- Execute scripts/06-ai-chat-logs.sql
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Test the Implementation
```bash
# Start development server
npm run dev

# In another terminal, test the API
node test-ai-chat.js
```

## Usage Guide

### For Students
1. **Access**: Navigate to `/ai-scientist` (requires login)
2. **Ask Questions**: Type science questions or use suggested prompts
3. **Get Personalized Answers**: Receive responses adapted to your grade level and learning style
4. **See Sources**: When textbook content is used, it's clearly indicated

### For Educators
- All interactions are logged for analytics
- Can track which textbook content is most relevant
- Monitor student engagement patterns

## Suggested Questions Categories

### Biology
- How do plants make their own food?
- How do our bodies digest food?
- Why do animals hibernate?

### Physics
- Why do objects fall down?
- How do magnets work?
- What makes things float?

### Earth Science
- What makes the weather change?
- How are mountains formed?
- What are the phases of the moon?

## Customization Options

### Learning Style Adaptations
- **Visual Learners**: Descriptive language, visual metaphors
- **Auditory Learners**: Sound-based examples, rhythm references
- **Kinesthetic Learners**: Hands-on activities, movement examples

### Grade Level Adjustments
- Vocabulary complexity
- Concept depth
- Real-world examples
- Follow-up suggestions

## Error Handling
- Network errors show friendly messages
- API failures gracefully degrade
- Logging continues even if chat fails
- User authentication is verified

## Performance Considerations
- Textbook search limited to 5 most relevant results
- AI responses capped at 500 tokens
- Auto-scrolling optimized for smooth UX
- Component state properly managed

## Future Enhancements
- Voice input/output capabilities
- Image sharing in chat
- Multi-language support
- Advanced analytics dashboard
- Custom question suggestions based on curriculum

## Troubleshooting

### Common Issues
1. **"Access Denied"**: User needs to be logged in
2. **API Errors**: Check environment variables and API keys
3. **No Textbook Content**: Verify textbook processing is complete
4. **Slow Responses**: Check AI service status and network

### Debug Tools
- Use `test-ai-chat.js` for API testing
- Check browser network tab for request details
- Monitor Supabase logs for database issues
- Review console for client-side errors

## Security Features
- Row Level Security (RLS) on chat logs
- User authentication required
- Input sanitization
- Rate limiting (future enhancement)

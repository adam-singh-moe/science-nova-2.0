# Textbook Content Processing System

This system automatically extracts content from textbook PDFs stored in Supabase Storage and converts them into text embeddings for AI-enhanced content generation.

## Setup Instructions

### 1. Database Setup
Run the following SQL script to set up the required database tables and functions:
```sql
-- Run this script in your Supabase SQL editor
-- File: scripts/09-textbook-embeddings.sql
```

### 2. Storage Bucket Structure
Ensure your Supabase storage bucket is structured as follows:
```
textbook-content/
├── grade_1/
│   └── grade_1_textbook.pdf
├── grade_2/
│   └── grade_2_textbook.pdf
├── grade_3/
│   └── grade_3_textbook.pdf
├── grade_4/
│   └── grade_4_textbook.pdf
├── grade_5/
│   └── grade_5_textbook.pdf
└── grade_6/
    └── grade_6_textbook.pdf
```

### 3. Environment Variables
Ensure these environment variables are set:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
```

## How It Works

### 1. PDF Processing
- The system scans the `textbook-content` bucket for PDF files
- Each PDF is downloaded and processed to extract text content
- Text is chunked into manageable pieces (1000 characters with 200 character overlap)

### 2. Embedding Generation
- Each text chunk is converted to a vector embedding using Google's text-embedding-004 model
- Embeddings are stored in the `textbook_embeddings` table with metadata

### 3. Content Search
- When generating AI content, the system searches for relevant textbook chunks
- Uses vector similarity search to find the most relevant content
- Relevant content is included in the AI prompt for accurate, curriculum-aligned responses

### 4. AI Integration
- Enhanced content generation APIs now include textbook content
- AI responses are grounded in actual textbook material
- Content adapts to student's grade level and learning preference

## Usage

### Admin Interface
1. Go to the Admin Dashboard (`/admin`)
2. Navigate to "Textbook Content Management" section
3. Click "Process All Textbooks" to extract and embed content
4. Monitor processing status and statistics

### API Endpoints

#### Process Textbooks
```
POST /api/process-textbooks
```
Processes all textbook PDFs and generates embeddings (Admin only)

#### Get Processing Stats
```
GET /api/process-textbooks
```
Returns statistics about processed textbooks

### Automatic Integration
Once textbooks are processed, the AI content generation automatically includes relevant textbook content:

- **Topic Content**: `/api/generate-enhanced-content`
- **Adventure Stories**: `/api/generate-adventure-story`

## Features

### Content Search
- **Vector Similarity Search**: Finds the most relevant textbook content
- **Grade-Level Filtering**: Only searches content for the appropriate grade
- **Subject Filtering**: Prioritizes content from relevant study areas
- **Configurable Similarity Threshold**: Adjustable relevance scoring

### AI Enhancement
- **Contextual Content**: AI responses include relevant textbook excerpts
- **Curriculum Alignment**: Generated content follows textbook structure
- **Learning Style Adaptation**: Content adapts while maintaining textbook accuracy
- **Source Attribution**: AI can reference specific textbook sections

### Monitoring & Management
- **Processing Statistics**: Track chunks processed per grade
- **Content Availability**: Monitor which grades have processed content
- **Last Updated Tracking**: See when content was last processed
- **Error Handling**: Robust error reporting and recovery

## Technical Architecture

### Components
1. **PDF Processor** (`lib/textbook-processor.ts`): Extracts text from PDFs
2. **Content Search** (`lib/textbook-search.ts`): Finds relevant content using vector search
3. **Database Schema** (`scripts/09-textbook-embeddings.sql`): Stores embeddings and metadata
4. **Admin Interface** (`components/dashboard/admin-dashboard.tsx`): Management UI
5. **API Routes** (`app/api/process-textbooks/route.ts`): Processing endpoints

### Data Flow
1. PDF Upload → Supabase Storage (`textbook-content` bucket)
2. Admin Processing → PDF Text Extraction → Chunking → Embedding Generation
3. Content Request → Vector Search → Relevant Chunks → AI Prompt Enhancement
4. AI Generation → Textbook-Grounded Content → Student Delivery

## Troubleshooting

### Common Issues
1. **No content found**: Ensure PDFs are uploaded to correct bucket structure
2. **Processing fails**: Check PDF file format and size
3. **Search returns no results**: Lower similarity threshold or check grade level
4. **AI content not enhanced**: Verify embeddings exist for the grade level

### Performance Considerations
- Processing time depends on PDF size and content
- Large textbooks may take several minutes to process
- Embedding generation is rate-limited by Google AI API
- Vector search is optimized with database indexes

## Monitoring

The system provides comprehensive monitoring through:
- Processing success/failure rates
- Content chunk counts per grade
- Last processing timestamps
- Error logs and debugging information

## Content Generation Requirements

### Lesson Content Structure
The AI-generated lesson content now follows a structured format:
- **Introduction**: Engaging hook to capture student interest
- **Main Content**: 500-800 words with proper headings (`#` and `##`)
- **Visual Elements**: `[IMAGE_PROMPT: description]` placeholders for diagrams
- **Real-world Connections**: Examples and applications
- **Summary**: Key learning points reinforcement
- **Proper Formatting**: Line breaks (`\n\n`) between paragraphs

### Interactive Learning Elements

#### Flashcards (Minimum 3, Ideally 5-6)
- Question-answer pairs for key concepts
- Concise, memorable questions
- Informative, age-appropriate answers
- Focus on important terms and definitions
- Engaging content that reinforces learning

#### Quiz Questions (Exactly 5 Required)
- Multiple choice with 4 options each
- Grade-appropriate difficulty level
- Detailed explanations for correct answers
- Tests understanding of main lesson concepts
- Covers different aspects of the topic

### Example Content Format

```json
{
  "lessonContent": "# Welcome to Animal Habitats!\n\nHello, young explorers! Today we're going on an amazing journey to discover where animals live...\n\n## What is a Habitat?\n\nA habitat is like a special home for animals...",
  "flashcards": [
    {
      "id": "1",
      "front": "What is a habitat?", 
      "back": "A habitat is the natural place where an animal lives and finds everything it needs to survive."
    },
    {
      "id": "2",
      "front": "What do animals need in their habitat?",
      "back": "Animals need food, water, shelter, and space to live and raise their babies."
    },
    {
      "id": "3",
      "front": "Name three different types of habitats.",
      "back": "Forest, ocean, desert, grassland, wetland, and arctic are examples of habitats."
    }
  ],
  "quiz": [
    {
      "id": "1",
      "question": "What is the main thing a habitat provides for animals?",
      "options": ["Entertainment", "Everything they need to survive", "Just food", "Only shelter"],
      "correctAnswer": 1,
      "explanation": "A habitat provides all the basic needs: food, water, shelter, and space for animals to live and reproduce."
    }
    // ... 4 more quiz questions
  ]
}
```

This system ensures that all AI-generated content is grounded in actual curriculum materials while maintaining the personalized, engaging experience that Science Nova provides.

# Textbook Content Testing - Complete System

## Overview
I've created a comprehensive testing system that allows you to view and inspect the textbook content being fetched and provided to the AI for content generation. This system provides multiple ways to test and validate the textbook integration.

## 🔧 Testing Tools Created

### 1. **Web Interface Test Page** (`/test-textbook`)
**Access**: Navigate to `http://localhost:3000/test-textbook` (requires admin login)

**Features**:
- ✅ Interactive search form with all parameters
- ✅ Real-time content retrieval and analysis
- ✅ Visual inspection of found content chunks
- ✅ AI prompt preview with copy-to-clipboard
- ✅ Similarity scores and quality metrics
- ✅ Grade-level statistics and file information
- ✅ Sample queries for each grade level
- ✅ Tabbed interface for organized results

**What you can see**:
- Exact content chunks retrieved from textbooks
- Similarity scores (how relevant each chunk is)
- The complete AI prompt that would be sent to the AI model
- Statistics about available content for each grade
- Quality metrics and recommendations

### 2. **API Test Endpoint** (`/api/test-textbook-content`)
**Usage**: 
- GET: Returns sample queries and instructions
- POST: Performs detailed content search analysis

**Example API Call**:
```bash
curl -X POST http://localhost:3000/api/test-textbook-content \
  -H "Content-Type: application/json" \
  -d '{
    "query": "water cycle",
    "gradeLevel": 3,
    "studyArea": "Meteorology",
    "maxResults": 10,
    "minSimilarity": 0.5
  }'
```

**Response includes**:
- Search parameters and results summary
- Individual content chunks with similarity scores
- Formatted AI prompt ready for generation
- Grade-level statistics and recommendations

### 3. **Command Line Test Tool** (`test-textbook-cli.js`)
**Usage**:
```bash
# Search for specific content
node test-textbook-cli.js "water cycle" 3 Meteorology

# View statistics for all grades
node test-textbook-cli.js --stats

# Get help
node test-textbook-cli.js --help
```

**Features**:
- Quick testing without web interface
- Detailed console output with formatting
- Statistics overview for all grades
- Direct database access for debugging

### 4. **Demo Script** (`test-demo.js`)
**Usage**: `node test-demo.js`

**Purpose**: Shows how the testing works without requiring database setup

## 🎯 What You Can Test

### **Content Retrieval**
- ✅ Verify relevant textbook chunks are found
- ✅ Check similarity scores and ranking
- ✅ Inspect content quality and relevance
- ✅ See exact text that will be used by AI

### **AI Prompt Construction**
- ✅ View the complete prompt sent to AI
- ✅ Verify textbook content is properly formatted
- ✅ Check prompt length and structure
- ✅ Copy prompts for testing in other tools

### **Grade-Level Filtering**
- ✅ Ensure only appropriate grade content is used
- ✅ Verify grade-specific terminology and complexity
- ✅ Check content availability by grade

### **Search Quality Analysis**
- ✅ Test different similarity thresholds
- ✅ Evaluate search result relevance
- ✅ Get quality scores and recommendations
- ✅ Identify optimal search parameters

## 📊 Understanding Test Results

### **Similarity Scores**
- **0.8-1.0**: Highly relevant, exact topic matches
- **0.6-0.8**: Good relevance, related content
- **0.4-0.6**: Somewhat relevant, may be useful context
- **<0.4**: Low relevance, probably not useful

### **Quality Indicators**
- **Total Found**: Number of content chunks retrieved
- **Quality Score**: % of results above 70% similarity
- **AI Prompt Ready**: Whether enough content for generation
- **Average Similarity**: Overall relevance of results

### **Content Analysis**
- **Content Preview**: First 200 characters of each chunk
- **Word/Character Count**: Size metrics for each chunk
- **File Source**: Which textbook PDF the content came from
- **Chunk Index**: Position within the original document

## 🚀 Quick Start Testing

### **Step 1: Process Textbooks**
1. Go to Admin Dashboard (`/admin`)
2. Navigate to "Textbook Content Management" 
3. Click "Process All Textbooks"
4. Wait for processing to complete

### **Step 2: Test Content Retrieval**
Choose any method:

**Web Interface** (Recommended):
```
1. Navigate to http://localhost:3000/test-textbook
2. Enter search query (e.g., "water cycle")
3. Select grade level (e.g., 3)
4. Click "Run Test"
5. Inspect results in multiple tabs
```

**Command Line**:
```bash
node test-textbook-cli.js "water cycle" 3
```

**API Call**:
```bash
curl -X POST http://localhost:3000/api/test-textbook-content \
  -H "Content-Type: application/json" \
  -d '{"query": "water cycle", "gradeLevel": 3}'
```

### **Step 3: Analyze Results**
- Review similarity scores for relevance
- Check if AI prompt contains good textbook content
- Verify grade-appropriate language and concepts
- Adjust similarity threshold if needed

## 📚 Sample Test Queries

### **Grade 1**: "plants", "weather", "animals"
### **Grade 2**: "water cycle", "magnets", "rocks"  
### **Grade 3**: "states of matter", "plant life cycle", "solar system"
### **Grade 4**: "food chains", "electricity", "earth layers"
### **Grade 5**: "human body systems", "chemical reactions", "simple machines"
### **Grade 6**: "photosynthesis", "periodic table", "plate tectonics"

## 🔍 Testing Workflow

### **1. Content Validation**
```
Search Query → Vector Similarity → Relevant Chunks → Quality Check
```

### **2. AI Prompt Construction**
```
Relevant Chunks → Format for AI → Add Instructions → Final Prompt
```

### **3. Generation Integration**
```
Final Prompt → AI Model → Enhanced Content → Student Delivery
```

## 🛠️ Troubleshooting

### **No Content Found**
- ✅ Check if textbooks uploaded to storage bucket
- ✅ Verify processing completed successfully  
- ✅ Confirm grade-level folder structure

### **Low Similarity Scores**
- ✅ Try different search terms
- ✅ Lower similarity threshold (0.3-0.4)
- ✅ Check if topic exists in textbook

### **API Errors**
- ✅ Ensure user is logged in (admin access)
- ✅ Check Supabase connection
- ✅ Verify environment variables set

## 💡 Best Practices

### **For Testing**
1. Start with broad search terms
2. Test multiple grades for comparison
3. Use subject-specific queries when possible
4. Check both high and low similarity results

### **For Content Quality**
1. Aim for similarity scores above 0.6
2. Include 5-10 chunks in AI prompts
3. Verify content is age-appropriate
4. Check for curriculum alignment

This comprehensive testing system ensures you can fully validate and monitor how textbook content is being retrieved and used by the AI to generate educational content for students.

# Textbook Content Testing

This directory contains several tools to test and inspect the textbook content processing system.

## Testing Tools Available

### 1. Web Interface Test (`/test-textbook`)
- **Access**: Navigate to `http://localhost:3000/test-textbook` (admin access required)
- **Features**:
  - Interactive search form with all parameters
  - Real-time content inspection
  - AI prompt preview
  - Statistics and grade-level analysis
  - Copy-to-clipboard functionality
  - Sample queries for each grade

### 2. API Test Endpoint (`/api/test-textbook-content`)
- **GET**: Returns sample queries and testing instructions
- **POST**: Performs content search with detailed analysis

### 3. Command Line Test (`test-textbook-cli.js`)
- **Usage**: `node test-textbook-cli.js "search query" <grade> [study_area]`
- **Examples**:
  ```bash
  node test-textbook-cli.js "water cycle" 3
  node test-textbook-cli.js "photosynthesis" 5 Biology
  node test-textbook-cli.js --stats
  ```

## Test Examples

### Sample Test Queries by Grade

**Grade 1:**
- `"plants"` (Biology)
- `"weather"` (Meteorology)
- `"animals"` (Biology)

**Grade 2:**
- `"water cycle"` (Meteorology)
- `"magnets"` (Physics)
- `"rocks"` (Geology)

**Grade 3:**
- `"states of matter"` (Physics)
- `"plant life cycle"` (Biology)
- `"solar system"` (Astronomy)

**Grade 4:**
- `"food chains"` (Biology)
- `"electricity"` (Physics)
- `"earth layers"` (Geology)

**Grade 5:**
- `"human body systems"` (Anatomy)
- `"chemical reactions"` (Chemistry)
- `"simple machines"` (Physics)

**Grade 6:**
- `"photosynthesis"` (Biology)
- `"periodic table"` (Chemistry)
- `"plate tectonics"` (Geology)

## What You Can Test

### 1. Content Retrieval
- Verify relevant textbook chunks are found
- Check similarity scores and ranking
- Inspect content quality and relevance

### 2. AI Prompt Construction
- See the formatted prompt sent to AI
- Verify textbook content is properly included
- Check prompt length and structure

### 3. Grade-Level Filtering
- Ensure only appropriate grade content is used
- Verify grade-specific terminology and complexity

### 4. Subject Area Filtering
- Test if study area filtering works correctly
- Check if relevant subjects are prioritized

### 5. Search Quality
- Test different similarity thresholds
- Evaluate search result relevance
- Check handling of edge cases

## Quick Start Testing

1. **Ensure textbooks are processed**:
   - Go to Admin Dashboard
   - Check "Textbook Content Management" section
   - Run "Process All Textbooks" if needed

2. **Test via web interface**:
   ```
   Navigate to: http://localhost:3000/test-textbook
   ```

3. **Test via command line**:
   ```bash
   node test-textbook-cli.js "water cycle" 3
   ```

4. **Test via API**:
   ```bash
   curl -X POST http://localhost:3000/api/test-textbook-content \
     -H "Content-Type: application/json" \
     -d '{"query": "water cycle", "gradeLevel": 3, "studyArea": "Meteorology"}'
   ```

## Interpreting Results

### Similarity Scores
- **0.8-1.0**: Highly relevant, exact matches
- **0.6-0.8**: Good relevance, related content
- **0.4-0.6**: Somewhat relevant, may be useful
- **<0.4**: Low relevance, probably not useful

### Quality Indicators
- **Content Available**: Shows if any content exists for the grade
- **Quality Score**: Percentage of results above 70% similarity
- **AI Prompt Ready**: Whether enough content was found for AI
- **Recommended Min Similarity**: Suggested threshold for filtering

### Common Issues
- **No content found**: Textbooks may not be processed for that grade
- **Low similarity scores**: Query may be too specific or use different terminology
- **Empty results**: Check if grade level has any textbook content

## Environment Setup

Ensure these environment variables are set:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
```

## Troubleshooting

### No Content Found
1. Check if textbooks are uploaded to Supabase storage
2. Verify processing completed successfully
3. Check grade-level specific folders

### API Errors
1. Verify authentication (must be logged in)
2. Check Supabase connection
3. Ensure database schema is properly set up

### Poor Search Results
1. Try different search terms
2. Lower the similarity threshold
3. Check if textbook contains the topic

This testing system allows you to fully inspect and validate the textbook content integration before it's used in production AI content generation.

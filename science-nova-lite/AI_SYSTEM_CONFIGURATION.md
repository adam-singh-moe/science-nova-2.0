# AI System Configuration Guide

## Overview

The Science Nova Lite application has been updated to use a simplified AI system that supports multiple providers with automatic fallbacks. This ensures reliable AI functionality across the application.

## Current AI Features

- **Student AI Chat**: Interactive science tutor for students
- **Content Generation**: Lessons, flashcards, quizzes for educators
- **Discovery Facts**: Interesting science facts for topics
- **Arcade Games**: Educational games and activities
- **Admin Tools**: Content generation helpers for administrators

## AI Provider Setup

### Option 1: OpenAI (Recommended - Simple Setup)

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env.local` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. That's it! The system will automatically use OpenAI for all AI features.

### Option 2: Google AI (Alternative - Complex Setup)

**Note**: Google AI currently shows 403 errors ("SERVICE_DISABLED") and requires complex Google Cloud setup. We recommend using OpenAI instead.

If you still want to use Google AI:
1. Enable the Generative Language API in Google Cloud Console
2. Get an API key or set up service account credentials
3. Add to your `.env.local` file:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
   ```

## How the AI System Works

### SimpleAI Utility (`lib/simple-ai.ts`)

The application uses a unified SimpleAI class that:
- **Provider Detection**: Automatically detects available AI providers
- **Intelligent Fallbacks**: Falls back to mock content if AI is unavailable
- **Error Handling**: Graceful degradation when AI calls fail
- **Status Reporting**: Provides AI status information for debugging

### Fallback System

When AI is not available, the system provides:
- Educational placeholder content
- Topic-appropriate mock responses
- Clear indicators that AI is temporarily unavailable
- Fully functional application without AI dependency

## Updated Endpoints

All AI endpoints have been updated to use the SimpleAI system:
- `/api/ai-chat` - Student chat interface
- `/api/generate-enhanced-content` - Main content generation
- `/api/admin/generate-discovery` - Discovery facts
- `/api/ai-helper` - Classroom content tools
- `/api/admin/discovery-helper` - Discovery content helper
- `/api/admin/generate-arcade` - Arcade games generation
- `/api/admin/arcade-helper` - Arcade content helper

## Testing AI Features

1. **Check AI Status**: Look for console logs showing AI provider status
2. **Test Student Chat**: Visit the student interface and try asking science questions
3. **Test Admin Tools**: Use content generation features in the admin panel
4. **Monitor Fallbacks**: Without API keys, verify that fallback content appears

## Troubleshooting

### No AI Key Configured
- System will show status: `{ available: false, provider: 'none', fallbackMode: true }`
- All features work with placeholder content
- Add an OpenAI API key to enable full AI functionality

### OpenAI API Issues
- Check API key validity
- Verify sufficient OpenAI credits
- Monitor console for specific error messages

### Google AI Issues (if using)
- 403 errors typically mean the API is disabled in Google Cloud
- Complex setup required for Google Cloud service accounts
- Consider switching to OpenAI for simpler setup

## Migration Summary

**What Changed:**
- ✅ Replaced complex Google AI SDK dependencies with unified SimpleAI system
- ✅ Added OpenAI as primary recommended provider  
- ✅ Implemented comprehensive fallback system
- ✅ Updated all AI endpoints to use new system
- ✅ Maintained backward compatibility with existing environment variables

**What Works:**
- ✅ All AI features work with OpenAI API key
- ✅ All AI features provide fallbacks without API key
- ✅ Student and admin interfaces fully functional
- ✅ Content generation, chat, and educational tools operational

**Next Steps:**
1. Add `OPENAI_API_KEY` to your `.env.local` file
2. Test the AI features across student and admin interfaces
3. Remove unused Google AI environment variables if desired
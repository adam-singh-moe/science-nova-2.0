# Floating AI Chat - Suggested Questions Feature

## Overview
Added grade-appropriate suggested questions to the floating AI chat widget to help users get started with meaningful science conversations.

## Feature Details

### Smart Question Display
- **When shown**: Suggested questions appear only when the chat shows just the welcome message (initial state)
- **Auto-hide**: Questions disappear once the user starts a conversation to maximize chat space
- **Grade-appropriate**: Questions are tailored to the user's grade level (K-2, 3-5, 6-8, 9-12)

### Question Categories by Grade Level

#### Grades K-2 (Early Elementary)
- **Living Things**: Basic animal and plant care
- **My Body**: Simple body functions and health
- **Weather**: Basic weather concepts

#### Grades 3-5 (Elementary)
- **Biology**: Plant processes and animal behavior
- **Physics**: Basic forces and magnetism
- **Earth Science**: Weather patterns and rock formation

#### Grades 6-8 (Middle School)
- **Life Science**: Cell biology and body systems
- **Physical Science**: Matter, mass, and chemical reactions
- **Earth Science**: Geological processes and water cycle

#### Grades 9-12 (High School)
- **Biology**: Advanced genetics and ecosystems
- **Chemistry**: Chemical bonds and reactions
- **Physics**: Motion, electricity, and electromagnetic radiation

### User Experience
1. **First interaction**: User opens floating chat and sees welcome message with 4 compact question tabs above the input field
2. **Question selection**: User clicks any suggested question tab to populate the input field
3. **Conversation start**: Once user sends a message, suggested question tabs hide to make room for chat
4. **Compact display**: Question tabs are small, pill-shaped buttons that truncate long questions (25 char max)
5. **Input area preserved**: Full input functionality maintained with send button and "Open Full Chat" link

### Implementation Details

#### UI Components
- **Question tabs**: Small pill-shaped buttons above the input area
- **Truncation**: Questions longer than 25 characters show "..." 
- **Hover effects**: Subtle scale and shadow animations
- **Color scheme**: Blue theme with hover states
- **Space-efficient**: Takes minimal space above input, doesn't interfere with chat messages

#### Technical Features
- **Grade-aware**: Uses `profile.grade_level` to determine appropriate questions
- **Compact layout**: Shows 4 questions total (2 from first 2 categories)
- **Text truncation**: Long questions are shortened with ellipsis
- **Non-blocking**: Input area remains fully functional
- **Auto-hide**: Tabs disappear once conversation starts

### Code Structure
```tsx
// Grade-appropriate question generation
const getGradeAppropriateQuestions = (gradeLevel: number) => { ... }

// Conditional display in chat messages area
{messages.length === 1 && (
  <div className="space-y-2 mt-3">
    {/* Suggested questions UI */}
  </div>
)}
```

### Benefits
1. **Better onboarding**: Helps users understand what kinds of questions they can ask
2. **Grade-appropriate**: Ensures questions match the user's learning level
3. **Science-focused**: Encourages educational conversations
4. **Space-efficient**: Compact design that doesn't overwhelm the small chat interface
5. **Progressive disclosure**: Shows when needed, hides when not needed

### Integration
- **Main AI Scientist page**: Full suggested questions interface with all categories
- **Floating chat**: Compact version with 2 categories and 2 questions each
- **Consistent experience**: Same question database used across both interfaces
- **Grade synchronization**: Both interfaces use the same user grade level

This feature enhances the floating AI chat by providing guided entry points for science learning while maintaining the compact, non-intrusive nature of the floating widget.

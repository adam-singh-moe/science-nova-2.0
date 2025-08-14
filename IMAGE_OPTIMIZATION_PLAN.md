# Image Generation Optimization Plan

## Current Issues:
1. **High Fallback Rate**: Rate limiting and slow generation cause most images to fall back to gradients
2. **No Persistence**: Images are regenerated for each story session
3. **No Preemptive Generation**: Images only generated when story is opened
4. **Aggressive Queuing**: 2-second delays between requests prevent efficient generation

## Solution: Multi-Tier Image System

### Tier 1: Background Image Cache
- Store generated images in Supabase for reuse
- Cache images by content hash to avoid regenerating similar prompts
- Persist images across story sessions

### Tier 2: Preemptive Generation
- Generate images asynchronously when adventures are created
- Use background job to generate images without blocking user experience
- Fallback gracefully if generation isn't complete

### Tier 3: Intelligent Batching
- Reduce API rate limits by batching similar prompts
- Optimize prompt similarity detection
- Smart retry logic with exponential backoff

### Tier 4: Enhanced Fallbacks
- High-quality theme-based illustrations as fallbacks
- Improved gradient designs
- Better Vanta effect matching

## Implementation Steps:
1. Create image cache table in Supabase
2. Implement background image generation job
3. Update story API to trigger preemptive generation
4. Modify storybook to use cached images first
5. Optimize rate limiting and batching logic
6. Enhanced fallback system

## Expected Results:
- 80%+ real AI images (vs current ~20%)
- Instant story loading with pre-generated images
- Graceful degradation when APIs are unavailable
- Better user experience with consistent visual quality

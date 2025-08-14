# Floating Chat Component - React Hooks Fix

## Issue
The `FloatingAIChat` component was causing a React Hooks order error due to conditional hook calls that violated the Rules of Hooks.

## Problem
The component had this structure:
1. State hooks and useAuth() called
2. Early return condition that could exit before all hooks were called
3. useEffect hook called after the conditional return

This violated React's Rules of Hooks, which require all hooks to be called in the same order every time the component renders.

## Solution
Restructured the component to ensure all hooks are called before any conditional rendering:

### Changes Made:

1. **Moved all hooks to the top**: All `useState`, `useEffect`, and custom hooks are now called before any conditional logic.

2. **Separated welcome message initialization**: Moved the welcome message from initial state to a dedicated `useEffect` that only runs when the profile is loaded.

3. **Moved conditional return after all hooks**: The conditional check for rendering is now placed after all hooks have been called.

### Before:
```tsx
export function FloatingAIChat({ position: propPosition }: FloatingAIChatProps) {
  const { profile, user } = useAuth()
  // ... state hooks
  const [messages, setMessages] = useState([/* initial message with profile */])
  
  useEffect(() => {
    // Settings loading
  }, [pathname])

  // ❌ Early return before all hooks are called
  if (!user || !profile || pathname === '/ai-scientist' || !settings.enabled) {
    return null
  }

  // ❌ This useEffect might not be called consistently
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
}
```

### After:
```tsx
export function FloatingAIChat({ position: propPosition }: FloatingAIChatProps) {
  const { profile, user } = useAuth()
  // ... state hooks
  const [messages, setMessages] = useState([]) // Empty initial state
  
  // ✅ All useEffect hooks called consistently
  useEffect(() => {
    // Settings loading
  }, [pathname])

  useEffect(() => {
    // Welcome message initialization
  }, [profile, messages.length])

  useEffect(() => {
    // Auto-scroll
  }, [messages])

  // ✅ Conditional return after all hooks
  if (!user || !profile || pathname === '/ai-scientist' || !settings.enabled) {
    return null
  }
}
```

## Result
- ✅ React Hooks order error resolved
- ✅ Component renders correctly
- ✅ All functionality preserved
- ✅ Build completes successfully
- ✅ No regression in chat features

## Verification
- Build test: `npm run build` ✅
- Development server: `npm run dev` ✅
- No ESLint/TypeScript errors ✅

The floating AI chat component now follows React best practices and renders reliably across all pages in the application.

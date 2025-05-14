# User Feedback System for AI Responses

This project includes a comprehensive feedback system for collecting user feedback on AI-generated responses. It allows users to rate responses, provide comments, and suggest improvements, which helps improve the system over time.

## Overview

The feedback system consists of several components:

1. **FeedbackLoop** - Core feedback engine (singleton) that manages:
   - Session tracking
   - Event logging (user inputs, AI outputs)
   - Feedback collection
   - Persistent storage

2. **FeedbackProvider** - React context provider that:
   - Makes the feedback functions available throughout the app
   - Handles initialization and session management
   - Provides hooks for components to access feedback functionality

3. **FeedbackUI** - A reusable React component that:
   - Displays rating controls (thumbs up/down)
   - Collects user comments on responses
   - Allows users to suggest improvements

4. **useFeedbackEvent** - A custom React hook that:
   - Simplifies integration with components
   - Tracks related inputs and outputs
   - Manages event IDs for feedback

5. **Client-side Storage** - Local storage implementation for:
   - Storing feedback data
   - Collecting and aggregating feedback
   - Managing feedback sessions

## Setup

The feedback system is already integrated into the application. It's set up in `App.tsx` to wrap all components:

```tsx
// In App.tsx
<FeedbackProvider apiEndpoint="/api/feedback" debugMode={false}>
  {/* Application components */}
</FeedbackProvider>
```

## Using the Feedback System

### Basic Usage

To add feedback functionality to a component that uses AI:

1. Import the feedback hook:

```tsx
import { useFeedbackEvent } from '@/lib/useFeedbackEvent';
```

2. Use the hook in your component:

```tsx
const { eventId, logInput, logOutput } = useFeedbackEvent();
```

3. Log user inputs and AI outputs:

```tsx
// When user submits a prompt
const inputId = logInput(userPrompt);

// When AI responds
logOutput(aiResponse);
```

4. Add the feedback UI component:

```tsx
import { FeedbackUI } from '@/components/FeedbackUI';

// In your JSX:
{eventId && (
  <FeedbackUI eventId={eventId} />
)}
```

### Automatic Tracking

For automatic tracking, use the autoLog option:

```tsx
const { eventId } = useFeedbackEvent({
  userInput: prompt,  // Will be logged automatically when it changes
  aiOutput: response, // Will be logged automatically when it changes
  autoLog: true
});
```

## The Feedback Dashboard

A dashboard for viewing and analyzing feedback is available at `/feedback-dashboard`. It shows:

- All feedback events
- Session information
- Ratings and comments
- Improvement suggestions

## Session Management

Sessions are automatically created when the application loads and are stored in localStorage. They track all interactions during a user session, including:

- User inputs
- AI responses
- Feedback events
- Suggestions

## Data Storage

Feedback data is stored in the browser's localStorage:

- `feedback-items` - Individual feedback events
- `feedback-sessions` - Complete session data

This means that feedback data is specific to each user's browser and persists between sessions until the localStorage is cleared.

## Extending the System

To extend the feedback system:

1. Add new event types in `feedbackLoop.ts`
2. Create specialized UI components for specific feedback types
3. Add additional analysis tools to the dashboard
4. Implement server-side storage if needed for persistent data collection

## Privacy Considerations

The feedback system collects user interactions and ratings. It's important to:

1. Include appropriate privacy notices
2. Get user consent for data collection
3. Consider offering an opt-out option
4. Implement data retention policies

## Troubleshooting

Common issues:

- **Missing feedback UI**: Check that the eventId is properly set and passed to the FeedbackUI component
- **Feedback not saved**: Ensure localStorage is accessible and not full
- **Unlinked feedback events**: Make sure to use the correct eventId when logging related events 
import type { FeedbackItem, FeedbackSession } from '../../lib/feedbackLoop';

// This is a mock API implementation that will be used client-side
// In a real app, this would be a server endpoint

/**
 * Submit feedback to the API
 */
export async function submitFeedback(feedback: FeedbackItem): Promise<any> {
  console.log('Submitting feedback to API:', feedback);
  // In a real implementation, this would make an API call
  return { success: true };
}

/**
 * Submit a session to the API
 */
export async function submitSession(session: FeedbackSession): Promise<any> {
  console.log('Submitting session to API:', session);
  // In a real implementation, this would make an API call
  return { success: true };
}

// Mock API handler that can be used with fetch
export async function handleFeedbackRequest(url: string, method: string, body: any): Promise<any> {
  // Only allow POST requests
  if (method !== 'POST') {
    return {
      status: 405,
      json: { message: 'Method not allowed' }
    };
  }

  try {
    // Handle different endpoints
    if (url.includes('/api/feedback/session')) {
      const result = await submitSession(body);
      return {
        status: result.success ? 200 : 400,
        json: { message: result.message }
      };
    } else {
      // Regular feedback endpoint
      const result = await submitFeedback(body);
      return {
        status: result.success ? 200 : 400,
        json: { message: result.message }
      };
    }
  } catch (error) {
    console.error('Error handling feedback:', error);
    return {
      status: 500,
      json: { message: 'Internal error' }
    };
  }
} 
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { feedbackLoop, FeedbackRating } from '../lib/feedbackLoop';
import { isFluvioEnabled, getFluvioServerUrl } from '../config/fluvio';

type Feedback = {
  id: string;
  message: string;
  rating: number;
  userId?: string;
  timestamp: number;
  category?: string;
  page?: string;
};

type FeedbackContextType = {
  submitFeedback: (feedback: Omit<Feedback, 'id' | 'timestamp'>) => Promise<void>;
  isSubmitting: boolean;
  debugMode: boolean;
  suggestImprovement: (eventId: string, suggestion: string) => void;
  logUserInput: (content: string) => string;
  logAIOutput: (content: string, relatedEventId?: string) => string;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  isFluvioEnabled: boolean;
  setFluvioEnabled: (enabled: boolean) => void;
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

type FeedbackProviderProps = {
  children: ReactNode;
  apiEndpoint: string;
  debugMode?: boolean;
  enabled?: boolean;
  useFluvio?: boolean;
};

export const FeedbackProvider = ({ 
  children, 
  apiEndpoint,
  debugMode = false,
  enabled = true,
  useFluvio = false
}: FeedbackProviderProps) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [fluvioEnabled, setFluvioEnabled] = useState(useFluvio && isFluvioEnabled());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize feedback system when component mounts
    feedbackLoop.init({
      apiEndpoint,
      enabled: isEnabled,
      debugMode,
      useFluvio: fluvioEnabled,
      fluvioUrl: getFluvioServerUrl(),
    });

    // Start a new session
    feedbackLoop.startNewSession();

    // Clean up session when component unmounts
    return () => {
      feedbackLoop.endCurrentSession();
    };
  }, [apiEndpoint, debugMode, fluvioEnabled]);

  // Update the enabled state if it changes
  useEffect(() => {
    setIsEnabled(enabled);
    feedbackLoop.setEnabled(enabled);
  }, [enabled]);

  const submitFeedback = async (feedback: Omit<Feedback, 'id' | 'timestamp'>) => {
    setIsSubmitting(true);
    try {
      if (debugMode) {
        console.log('Debug mode: Feedback submission', feedback);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      } else {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...feedback,
            timestamp: Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextValue: FeedbackContextType = {
    submitFeedback,
    isSubmitting,
    debugMode,
    suggestImprovement: (eventId, suggestion) => {
      feedbackLoop.suggestImprovement(eventId, suggestion);
    },
    logUserInput: (content) => {
      return feedbackLoop.logUserInput(content);
    },
    logAIOutput: (content, relatedEventId) => {
      return feedbackLoop.logAIOutput(content, relatedEventId);
    },
    isEnabled,
    setEnabled: (value) => {
      setIsEnabled(value);
      feedbackLoop.setEnabled(value);
    },
    isFluvioEnabled: fluvioEnabled,
    setFluvioEnabled: (value) => {
      setFluvioEnabled(value);
      
      // Reinitialize the feedback loop with the new Fluvio setting
      feedbackLoop.init({
        apiEndpoint,
        enabled: isEnabled,
        debugMode,
        useFluvio: value,
        fluvioUrl: getFluvioServerUrl(),
      });
    },
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
    </FeedbackContext.Provider>
  );
}; 
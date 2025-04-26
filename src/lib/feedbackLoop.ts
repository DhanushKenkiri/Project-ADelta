/**
 * FeedbackLoop - Real-time feedback collection and analytics system
 * 
 * This module provides functionality for:
 * 1. Logging user input and AI outputs
 * 2. Collecting real-time feedback for improving generations
 * 3. Building training data for fine-tuning future models
 */

import { EventEmitter } from './EventEmitter';
import { submitFeedback, submitSession } from '../pages/api/feedback';
import { fluvioService } from './fluvioService';

// Types for feedback system
export type FeedbackRating = 'positive' | 'negative' | 'neutral';
export type FeedbackEvent = 'user-input' | 'ai-output' | 'feedback' | 'suggestion';

export interface FeedbackItem {
  id: string;
  timestamp: number;
  type: FeedbackEvent;
  sessionId: string;
  eventId?: string;
  content?: string;
  rating?: FeedbackRating;
  comment?: string;
}

export interface FeedbackSession {
  id: string;
  startTime: number;
  endTime?: number;
  events: FeedbackItem[];
}

type FeedbackLoopConfig = {
  apiEndpoint: string;
  enabled: boolean;
  debugMode: boolean;
  useFluvio: boolean;
  fluvioUrl?: string;
};

// Main FeedbackLoop class
export class FeedbackLoop {
  private static instance: FeedbackLoop;
  private eventEmitter: EventEmitter;
  private sessions: FeedbackSession[] = [];
  private currentSession: FeedbackSession | null = null;
  private config: FeedbackLoopConfig = {
    apiEndpoint: '',
    enabled: true,
    debugMode: false,
    useFluvio: false
  };
  private sessionId: string = '';

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.initializeSession();
    this.loadSessions();
  }

  /**
   * Get the singleton instance of FeedbackLoop
   */
  public static getInstance(): FeedbackLoop {
    if (!FeedbackLoop.instance) {
      FeedbackLoop.instance = new FeedbackLoop();
    }
    return FeedbackLoop.instance;
  }

  /**
   * Initialize with configuration options
   */
  public init(config: FeedbackLoopConfig): void {
    this.config = config;
    if (this.config.debugMode) {
      console.log('FeedbackLoop initialized with config:', config);
    }
  }

  /**
   * Set whether the feedback system is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (this.config.debugMode) {
      console.log('Feedback collection enabled:', enabled);
    }
  }

  /**
   * Initialize a new user session
   */
  private initializeSession(): void {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';
    const platform = typeof navigator !== 'undefined' ? navigator.platform : 'server';
    
    this.currentSession = {
      id: this.generateId(),
      startTime: Date.now(),
      events: []
    };

    this.log('Started new feedback session:', this.currentSession.id);

    if (this.config.debugMode) {
      console.log('FeedbackLoop: New session initialized', this.currentSession.id);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Configure the feedback loop system
   */
  public configure(options: {
    apiEndpoint?: string;
    enabled?: boolean;
    debugMode?: boolean;
  }): void {
    if (options.apiEndpoint) {
      this.config.apiEndpoint = options.apiEndpoint;
    }

    if (options.enabled !== undefined) {
      this.config.enabled = options.enabled;
    }

    if (options.debugMode !== undefined) {
      this.config.debugMode = options.debugMode;
    }

    this.log('Configuration updated');

    if (this.config.enabled && !this.currentSession) {
      this.startNewSession();
    }
  }

  /**
   * Start a new session
   */
  public startNewSession(): string {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (this.config.debugMode) {
      console.log('Started new feedback session:', this.sessionId);
    }
    return this.sessionId;
  }

  /**
   * End the current session
   */
  public endCurrentSession(): void {
    if (this.config.debugMode) {
      console.log('Ended feedback session:', this.sessionId);
    }
    this.sessionId = '';
  }

  /**
   * Log a user input event
   */
  public logUserInput(content: string): string {
    if (!this.config.enabled) return '';
    
    const eventId = `user_input_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    if (this.config.debugMode) {
      console.log('Logging user input:', { eventId, content });
    }
    
    return eventId;
  }

  /**
   * Log an AI output event
   */
  public logAIOutput(content: string, relatedEventId?: string): string {
    if (!this.config.enabled) return '';
    
    const eventId = `ai_output_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    if (this.config.debugMode) {
      console.log('Logging AI output:', { eventId, relatedEventId, content });
    }
    
    return eventId;
  }

  /**
   * Submit feedback for an AI response
   */
  public submitFeedback(eventId: string, rating: FeedbackRating, comment?: string): void {
    if (!this.config.enabled) return;
    
    if (this.config.debugMode) {
      console.log('Submitting feedback:', { eventId, rating, comment });
      return;
    }

    // In a real implementation, this would send to the server
    if (this.config.useFluvio) {
      console.log('Would send to Fluvio:', { eventId, rating, comment });
    } else {
      fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          eventId,
          rating,
          comment,
          timestamp: Date.now()
        })
      }).catch(err => {
        console.error('Error submitting feedback:', err);
      });
    }
  }

  /**
   * Submit a suggestion for improvement
   */
  public suggestImprovement(eventId: string, suggestion: string): void {
    if (!this.config.enabled) return;
    
    if (this.config.debugMode) {
      console.log('Suggesting improvement:', { eventId, suggestion });
      return;
    }

    // In a real implementation, this would send to the server
  }

  /**
   * Get all sessions
   */
  public getSessions(): FeedbackSession[] {
    return this.sessions;
  }

  /**
   * Get the current session
   */
  public getCurrentSession(): FeedbackSession | null {
    return this.currentSession;
  }

  /**
   * Export training data for fine-tuning
   */
  public exportTrainingData(): Array<{input: any, output: any, feedback?: FeedbackRating}> {
    const trainingData: Array<{input: any, output: any, feedback?: FeedbackRating}> = [];
    
    // Go through all sessions
    for (const session of this.sessions) {
      let currentUserInput: any = null;
      let currentAIOutput: any = null;
      let currentEventId: string | undefined;
      
      // Process events in chronological order
      const sortedEvents = [...session.events].sort((a, b) => a.timestamp - b.timestamp);
      
      for (const event of sortedEvents) {
        switch (event.type) {
          case 'user-input':
            // Store user input
            currentUserInput = {
              role: 'user',
              content: event.content
            };
            currentEventId = event.eventId;
            break;
            
          case 'ai-output':
            // If this is a response to the current user input
            if (event.eventId === currentEventId && currentUserInput) {
              currentAIOutput = {
                role: 'assistant',
                content: event.content
              };
              
              // Add to training data without feedback yet
              trainingData.push({
                input: currentUserInput,
                output: currentAIOutput
              });
            }
            break;
            
          case 'feedback':
            // Find the training example that matches this feedback
            if (event.eventId) {
              const index = trainingData.findIndex(
                item => item.output?.content === session.events.find(
                  e => e.eventId === event.eventId && e.type === 'ai-output'
                )?.content
              );
              
              if (index !== -1) {
                // Add the feedback to the training example
                trainingData[index].feedback = event.rating;
              }
            }
            break;
        }
      }
    }
    
    return trainingData;
  }

  /**
   * Submit a session to the API
   */
  private submitSessionData(session: FeedbackSession): void {
    if (!this.config.enabled) return;
    
    // Only submit if we have events
    if (session.events.length === 0) return;
    
    try {
      submitSession(session)
        .then(response => {
          this.log('Session data submitted successfully:', session.id);
        })
        .catch(error => {
          console.error('Error submitting session data:', error);
        });
    } catch (error) {
      console.error('Error submitting session data:', error);
    }
    
    // Send to Fluvio if enabled
    if (this.config.useFluvio) {
      fluvioService.sendSession(session).catch(error => {
        console.error('Error sending session to Fluvio:', error);
      });
    }
  }

  /**
   * Submit feedback to the API
   */
  private submitFeedbackData(feedback: FeedbackItem): void {
    if (!this.config.enabled) return;
    
    try {
      submitFeedback(feedback)
        .then(response => {
          this.log('Feedback submitted successfully:', feedback.id);
        })
        .catch(error => {
          console.error('Error submitting feedback:', error);
        });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }

  /**
   * Save sessions to local storage
   */
  private saveSessions(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('feedback_sessions', JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Error saving sessions to localStorage:', error);
    }
  }

  /**
   * Load sessions from local storage
   */
  private loadSessions(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const sessionsJson = localStorage.getItem('feedback_sessions');
      if (sessionsJson) {
        this.sessions = JSON.parse(sessionsJson);
      }
    } catch (error) {
      console.error('Error loading sessions from localStorage:', error);
    }
  }

  /**
   * Log a message if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.debugMode) {
      console.log('[FeedbackLoop]', ...args);
    }
  }
}

// Create and export the singleton instance
export const feedbackLoop = FeedbackLoop.getInstance(); 
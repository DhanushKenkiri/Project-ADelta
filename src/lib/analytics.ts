/**
 * Analytics - Service for processing and visualizing feedback data
 * 
 * This module provides functionality for:
 * 1. Processing feedback data
 * 2. Generating analytics reports
 * 3. Visualizing feedback trends
 */

import { FeedbackEvent, FeedbackRating, UserSession } from './feedbackLoop';

export interface AnalyticsReport {
  sessionCount: number;
  averageSessionDuration: number;
  totalEvents: number;
  eventBreakdown: {
    user_input: number;
    ai_output: number;
    user_feedback: number;
    system_event: number;
  };
  feedbackStats: {
    averageRating: number;
    totalFeedback: number;
    ratingsDistribution: Record<number, number>; // key: rating, value: count
    commonFeedbackCategories: Array<{category: string, count: number}>;
  };
  timeAnalysis: {
    eventsPerHour: Record<number, number>;
    feedbackByDayOfWeek: Record<string, number>;
  };
}

export class Analytics {
  private static instance: Analytics;
  private historyLimit = 100; // Limit the number of sessions to keep in memory
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get the singleton instance of Analytics
   */
  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }
  
  /**
   * Generate an analytics report from session data
   */
  public generateReport(sessions: UserSession[]): AnalyticsReport {
    if (!sessions || sessions.length === 0) {
      return this.getEmptyReport();
    }
    
    // Calculate session statistics
    const sessionCount = sessions.length;
    let totalDuration = 0;
    
    sessions.forEach(session => {
      const lastEvent = session.events[session.events.length - 1];
      const endTime = lastEvent ? lastEvent.timestamp : Date.now();
      totalDuration += (endTime - session.startTime);
    });
    
    const averageSessionDuration = Math.round(totalDuration / sessionCount / 1000); // in seconds
    
    // Count events by type
    const eventBreakdown = {
      user_input: 0,
      ai_output: 0,
      user_feedback: 0,
      system_event: 0
    };
    
    let totalEvents = 0;
    
    // Analyze feedback
    const ratingsDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    let totalRating = 0;
    let totalFeedbackCount = 0;
    
    // Category analysis
    const categoryCount: Record<string, number> = {};
    
    // Time analysis
    const eventsPerHour: Record<number, number> = {};
    const feedbackByDayOfWeek: Record<string, number> = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };
    
    // Process all events in all sessions
    sessions.forEach(session => {
      session.events.forEach(event => {
        totalEvents++;
        
        // Count by event type
        if (eventBreakdown.hasOwnProperty(event.type)) {
          eventBreakdown[event.type as keyof typeof eventBreakdown]++;
        }
        
        // Analyze feedback
        if (event.type === 'user_feedback' && event.content) {
          const feedback = event.content as FeedbackRating;
          
          if (feedback.rating && feedback.rating >= 1 && feedback.rating <= 5) {
            ratingsDistribution[feedback.rating]++;
            totalRating += feedback.rating;
            totalFeedbackCount++;
          }
          
          // Count categories
          if (feedback.categories && Array.isArray(feedback.categories)) {
            feedback.categories.forEach(category => {
              categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
          }
          
          // Analyze by day of week
          const dayOfWeek = new Date(event.timestamp).toLocaleString('en-US', { weekday: 'long' });
          feedbackByDayOfWeek[dayOfWeek]++;
        }
        
        // Time analysis - events per hour
        const hour = new Date(event.timestamp).getHours();
        eventsPerHour[hour] = (eventsPerHour[hour] || 0) + 1;
      });
    });
    
    // Prepare category breakdown
    const commonFeedbackCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 categories
    
    return {
      sessionCount,
      averageSessionDuration,
      totalEvents,
      eventBreakdown,
      feedbackStats: {
        averageRating: totalFeedbackCount > 0 ? totalRating / totalFeedbackCount : 0,
        totalFeedback: totalFeedbackCount,
        ratingsDistribution,
        commonFeedbackCategories
      },
      timeAnalysis: {
        eventsPerHour,
        feedbackByDayOfWeek
      }
    };
  }
  
  /**
   * Get an empty report structure with zero values
   */
  private getEmptyReport(): AnalyticsReport {
    return {
      sessionCount: 0,
      averageSessionDuration: 0,
      totalEvents: 0,
      eventBreakdown: {
        user_input: 0,
        ai_output: 0,
        user_feedback: 0,
        system_event: 0
      },
      feedbackStats: {
        averageRating: 0,
        totalFeedback: 0,
        ratingsDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        commonFeedbackCategories: []
      },
      timeAnalysis: {
        eventsPerHour: {},
        feedbackByDayOfWeek: {
          'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
          'Thursday': 0, 'Friday': 0, 'Saturday': 0
        }
      }
    };
  }
  
  /**
   * Analyze common improvement patterns from feedback
   */
  public analyzeImprovements(sessions: UserSession[]): Array<{pattern: string, count: number}> {
    const improvementTexts: string[] = [];
    
    // Extract all improvement texts
    sessions.forEach(session => {
      session.events.forEach(event => {
        if (event.type === 'user_feedback' && 
            event.content && 
            typeof event.content === 'object' && 
            event.content.improvedVersion) {
          improvementTexts.push(event.content.improvedVersion);
        }
      });
    });
    
    // This is a simplified analysis - in a real system you'd use NLP to extract patterns
    const patterns: Record<string, number> = {};
    
    // Simple keyword extraction (this would be more sophisticated in a real system)
    const keywords = [
      'format', 'structure', 'clarity', 'concise', 'detail', 'example',
      'explanation', 'accuracy', 'tone', 'style', 'grammar', 'spelling'
    ];
    
    improvementTexts.forEach(text => {
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          patterns[keyword] = (patterns[keyword] || 0) + 1;
        }
      });
    });
    
    return Object.entries(patterns)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Find trending topics in user inputs
   */
  public findTrendingTopics(sessions: UserSession[]): Array<{topic: string, count: number}> {
    // This is a simplified implementation - a real system would use more sophisticated NLP
    const userInputs: string[] = [];
    
    // Extract all user inputs that are strings
    sessions.forEach(session => {
      session.events.forEach(event => {
        if (event.type === 'user_input' && typeof event.content === 'string') {
          userInputs.push(event.content);
        }
      });
    });
    
    // Extract keywords (simplified)
    const words: Record<string, number> = {};
    const stopWords = new Set(['the', 'and', 'or', 'but', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'about']);
    
    userInputs.forEach(input => {
      input.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))
        .forEach(word => {
          words[word] = (words[word] || 0) + 1;
        });
    });
    
    return Object.entries(words)
      .map(([topic, count]) => ({ topic, count }))
      .filter(item => item.count > 1) // Only include topics mentioned multiple times
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 topics
  }
  
  /**
   * Calculate the correlation between feedback ratings and metadata attributes
   */
  public calculateCorrelations(sessions: UserSession[], metadataKey: string): Array<{value: string, avgRating: number, count: number}> {
    const valueRatings: Record<string, number[]> = {};
    
    // Collect ratings grouped by metadata value
    sessions.forEach(session => {
      session.events.forEach(event => {
        if (event.type === 'user_feedback' && 
            event.content && 
            typeof event.content === 'object' && 
            event.content.rating &&
            event.metadata && 
            event.metadata[metadataKey]) {
          
          const value = String(event.metadata[metadataKey]);
          if (!valueRatings[value]) {
            valueRatings[value] = [];
          }
          valueRatings[value].push(event.content.rating);
        }
      });
    });
    
    // Calculate average rating for each value
    return Object.entries(valueRatings)
      .map(([value, ratings]) => ({
        value,
        avgRating: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
        count: ratings.length
      }))
      .filter(item => item.count >= 3) // Only include values with sufficient data
      .sort((a, b) => b.avgRating - a.avgRating);
  }
  
  /**
   * Generate data for a feedback timeline chart
   */
  public generateTimelineData(sessions: UserSession[], interval: 'hour' | 'day' | 'week' = 'day'): Array<{timestamp: number, avgRating: number, count: number}> {
    // Group feedback by time intervals
    const timeIntervals: Record<string, {sum: number, count: number}> = {};
    
    sessions.forEach(session => {
      session.events.forEach(event => {
        if (event.type === 'user_feedback' && 
            event.content && 
            typeof event.content === 'object' && 
            event.content.rating) {
          
          let intervalKey: string;
          const date = new Date(event.timestamp);
          
          if (interval === 'hour') {
            // Format: YYYY-MM-DD HH
            intervalKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${date.getHours()}`;
          } else if (interval === 'week') {
            // Get start of week (Sunday)
            const dayOfWeek = date.getDay();
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - dayOfWeek);
            intervalKey = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
          } else {
            // Default: day
            intervalKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }
          
          if (!timeIntervals[intervalKey]) {
            timeIntervals[intervalKey] = { sum: 0, count: 0 };
          }
          
          timeIntervals[intervalKey].sum += event.content.rating;
          timeIntervals[intervalKey].count += 1;
        }
      });
    });
    
    // Convert to array and calculate averages
    return Object.entries(timeIntervals)
      .map(([key, data]) => {
        let timestamp: number;
        
        if (interval === 'hour') {
          const [datePart, hourPart] = key.split(' ');
          const [year, month, day] = datePart.split('-').map(Number);
          timestamp = new Date(year, month - 1, day, Number(hourPart)).getTime();
        } else if (interval === 'week') {
          const [year, month, day] = key.split('-').map(Number);
          timestamp = new Date(year, month - 1, day).getTime();
        } else {
          // Default: day
          const [year, month, day] = key.split('-').map(Number);
          timestamp = new Date(year, month - 1, day).getTime();
        }
        
        return {
          timestamp,
          avgRating: data.sum / data.count,
          count: data.count
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}

// Export a default instance
export const analytics = Analytics.getInstance(); 
import React, { useState, useEffect } from 'react';
import { feedbackLoop } from '../lib/feedbackLoop';
import { analytics, AnalyticsReport } from '../lib/analytics';

interface AnalyticsDashboardProps {
  refreshInterval?: number; // in ms, if provided will auto-refresh
}

/**
 * AnalyticsDashboard - A component to visualize feedback and analytics data
 */
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  refreshInterval
}) => {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<Array<{topic: string, count: number}>>([]);
  const [improvementPatterns, setImprovementPatterns] = useState<Array<{pattern: string, count: number}>>([]);
  const [timelineData, setTimelineData] = useState<Array<{timestamp: number, avgRating: number, count: number}>>([]);
  const [timeInterval, setTimeInterval] = useState<'hour' | 'day' | 'week'>('day');
  const [loading, setLoading] = useState(true);

  // Load analytics data
  const loadAnalyticsData = () => {
    setLoading(true);
    
    // Get all sessions from the feedback loop
    const sessions = feedbackLoop.getSessions();
    
    // Generate the analytics report
    const analyticsReport = analytics.generateReport(sessions);
    setReport(analyticsReport);
    
    // Get trending topics
    const topics = analytics.findTrendingTopics(sessions);
    setTrendingTopics(topics);
    
    // Get improvement patterns
    const patterns = analytics.analyzeImprovements(sessions);
    setImprovementPatterns(patterns);
    
    // Get timeline data
    const timeline = analytics.generateTimelineData(sessions, timeInterval);
    setTimelineData(timeline);
    
    setLoading(false);
  };

  // Initial load and refresh interval
  useEffect(() => {
    loadAnalyticsData();
    
    // Set up refresh interval if provided
    if (refreshInterval) {
      const intervalId = setInterval(loadAnalyticsData, refreshInterval);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [refreshInterval, timeInterval]);

  // Format a timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    
    if (timeInterval === 'hour') {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric'
      });
    } else if (timeInterval === 'week') {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric'
      }) + ' (week)';
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Render loading state
  if (loading && !report) {
    return (
      <div className="p-6 bg-neutral-800 rounded-lg text-center">
        <p className="text-gray-300">Loading analytics data...</p>
      </div>
    );
  }

  // No data available
  if (!report || report.totalEvents === 0) {
    return (
      <div className="p-6 bg-neutral-800 rounded-lg text-center">
        <h2 className="text-xl font-semibold text-gray-200 mb-2">No Data Available</h2>
        <p className="text-gray-400">
          Start collecting feedback to see analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 text-gray-200 p-6 rounded-lg space-y-8">
      <header className="border-b border-neutral-700 pb-4">
        <h1 className="text-2xl font-bold">Feedback Analytics Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Insights based on {report.totalEvents} events from {report.sessionCount} user sessions
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-lg p-4 shadow">
          <h3 className="text-gray-400 text-sm font-medium">Average Rating</h3>
          <div className="mt-2 flex items-center">
            <span className="text-2xl font-bold">
              {report.feedbackStats.averageRating.toFixed(1)}
            </span>
            <div className="ml-2 flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg 
                  key={star}
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill={star <= Math.round(report.feedbackStats.averageRating) ? "currentColor" : "none"}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={star <= Math.round(report.feedbackStats.averageRating) ? 0 : 1.5} d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                </svg>
              ))}
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Based on {report.feedbackStats.totalFeedback} ratings
          </p>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 shadow">
          <h3 className="text-gray-400 text-sm font-medium">Avg Session Duration</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">
              {report.averageSessionDuration < 60 
                ? `${report.averageSessionDuration}s` 
                : `${Math.round(report.averageSessionDuration / 60)}m`}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {report.sessionCount} total sessions
          </p>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 shadow">
          <h3 className="text-gray-400 text-sm font-medium">User Inputs</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">
              {report.eventBreakdown.user_input}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {Math.round((report.eventBreakdown.user_input / report.totalEvents) * 100)}% of all events
          </p>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 shadow">
          <h3 className="text-gray-400 text-sm font-medium">AI Outputs</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">
              {report.eventBreakdown.ai_output}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {Math.round((report.eventBreakdown.ai_output / report.totalEvents) * 100)}% of all events
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-neutral-800 rounded-lg p-4 shadow">
        <h2 className="text-lg font-semibold mb-4">Rating Distribution</h2>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = report.feedbackStats.ratingsDistribution[rating] || 0;
            const percentage = report.feedbackStats.totalFeedback > 0 
              ? (count / report.feedbackStats.totalFeedback) * 100 
              : 0;
            
            return (
              <div key={rating} className="flex items-center">
                <div className="flex items-center w-16">
                  <span className="text-sm mr-1">{rating}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-4 h-4 text-yellow-400"
                  >
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 ml-2">
                  <div className="h-5 w-full bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-2 w-16 text-right">
                  <span className="text-sm">{count} ({Math.round(percentage)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout for Topics and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trending Topics */}
        <div className="bg-neutral-800 rounded-lg p-4 shadow">
          <h2 className="text-lg font-semibold mb-4">Trending Topics</h2>
          {trendingTopics.length > 0 ? (
            <div className="space-y-2">
              {trendingTopics.slice(0, 8).map((topic, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{topic.topic}</span>
                  <span className="text-xs bg-neutral-700 px-2 py-1 rounded-full">
                    {topic.count} mentions
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No trending topics found yet.</p>
          )}
        </div>

        {/* Improvement Areas */}
        <div className="bg-neutral-800 rounded-lg p-4 shadow">
          <h2 className="text-lg font-semibold mb-4">Common Improvement Areas</h2>
          {improvementPatterns.length > 0 ? (
            <div className="space-y-2">
              {improvementPatterns.slice(0, 8).map((pattern, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{pattern.pattern}</span>
                  <span className="text-xs bg-neutral-700 px-2 py-1 rounded-full">
                    {pattern.count} mentions
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No improvement patterns found yet.</p>
          )}
        </div>
      </div>

      {/* Feedback Timeline */}
      <div className="bg-neutral-800 rounded-lg p-4 shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Feedback Timeline</h2>
          <div className="flex space-x-2">
            <button 
              className={`px-2 py-1 text-xs rounded ${timeInterval === 'hour' ? 'bg-indigo-600' : 'bg-neutral-700'}`}
              onClick={() => setTimeInterval('hour')}
            >
              Hourly
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${timeInterval === 'day' ? 'bg-indigo-600' : 'bg-neutral-700'}`}
              onClick={() => setTimeInterval('day')}
            >
              Daily
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${timeInterval === 'week' ? 'bg-indigo-600' : 'bg-neutral-700'}`}
              onClick={() => setTimeInterval('week')}
            >
              Weekly
            </button>
          </div>
        </div>
        
        {timelineData.length > 0 ? (
          <div className="h-60 mt-4 relative">
            {/* Timeline Y-Axis */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span>5</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
            </div>
            
            {/* Timeline Chart */}
            <div className="ml-6 h-full flex items-end space-x-1 relative">
              {/* Horizontal guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div 
                    key={rating}
                    className="border-t border-neutral-700 w-full h-0"
                    style={{ top: `${((5 - rating) / 4) * 100}%` }}
                  ></div>
                ))}
              </div>
              
              {/* Bars */}
              {timelineData.map((data, index) => {
                const height = data.avgRating / 5 * 100;
                
                return (
                  <div 
                    key={index}
                    className="group relative flex flex-col items-center"
                    style={{ flexGrow: 1 }}
                  >
                    <div 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-t-sm"
                      style={{ height: `${height}%` }}
                    ></div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 transform -translate-x-1/2 bg-neutral-900 text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      <p className="font-medium">{formatTimestamp(data.timestamp)}</p>
                      <p>Average Rating: {data.avgRating.toFixed(1)}</p>
                      <p>Feedback Count: {data.count}</p>
                    </div>
                    
                    {/* X-axis labels (show only a few) */}
                    {(index % Math.ceil(timelineData.length / 8) === 0 || index === timelineData.length - 1) && (
                      <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {formatTimestamp(data.timestamp)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No timeline data available yet.</p>
        )}
      </div>

      {/* Footer with refresh button */}
      <div className="mt-6 flex justify-end">
        <button 
          className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded text-sm font-medium flex items-center"
          onClick={loadAnalyticsData}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 
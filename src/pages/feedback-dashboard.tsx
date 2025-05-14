import React, { useEffect, useState } from 'react';
import PageTitle from '@/components/PageTitle';
import { FeedbackItem, FeedbackSession } from '../lib/feedbackLoop';

interface DashboardProps {
  error?: string;
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const FeedbackDashboard: React.FC<DashboardProps> = ({ error: initialError }) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'sessions'>('feedback');
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(initialError || null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load feedback data from local storage
  useEffect(() => {
    try {
      setLoading(true);
      // Try to load sessions from localStorage
      const storedSessions = localStorage.getItem('feedback-sessions');
      const parsedSessions = storedSessions ? JSON.parse(storedSessions) : [];
      setSessions(parsedSessions);

      // For feedback items, we'll use mock data for now (in a real app this would come from an API)
      // Collect all feedback items from sessions
      const allFeedbackItems: FeedbackItem[] = [];
      parsedSessions.forEach((session: FeedbackSession) => {
        session.events.forEach(event => {
          allFeedbackItems.push(event);
        });
      });
      
      setFeedback(allFeedbackItems);
      setLoading(false);
    } catch (err) {
      console.error('Error loading feedback data:', err);
      setError('Failed to load feedback data. Please check console for details.');
      setLoading(false);
    }
  }, []);

  // Update filtered feedback when feedback or filter changes
  useEffect(() => {
    if (filter === 'all') {
      setFilteredFeedback(feedback);
    } else {
      setFilteredFeedback(feedback.filter(item => item.type === filter));
    }
  }, [feedback, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Feedback Dashboard</h1>
          <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg">
            <p className="text-blue-300">Loading feedback data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Feedback Dashboard</h1>
          <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <PageTitle title="Feedback Dashboard" />
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Feedback Dashboard</h1>
        
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'feedback' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('feedback')}
          >
            Feedback ({feedback.length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'sessions' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions ({sessions.length})
          </button>
        </div>
        
        {activeTab === 'feedback' && (
          <>
            <div className="flex items-center mb-4">
              <label className="mr-2 text-gray-400">Filter:</label>
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
              >
                <option value="all">All</option>
                <option value="user-input">User Input</option>
                <option value="ai-output">AI Output</option>
                <option value="feedback">Feedback</option>
                <option value="suggestion">Suggestions</option>
              </select>
            </div>
            
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Timestamp</th>
                    <th className="px-4 py-2 text-left">Session ID</th>
                    <th className="px-4 py-2 text-left">Event ID</th>
                    <th className="px-4 py-2 text-left">Rating</th>
                    <th className="px-4 py-2 text-left">Content</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.length > 0 ? (
                    filteredFeedback.map((item) => (
                      <tr key={item.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                            item.type === 'feedback' ? 'bg-blue-900/50 text-blue-200' :
                            item.type === 'suggestion' ? 'bg-purple-900/50 text-purple-200' :
                            item.type === 'user-input' ? 'bg-green-900/50 text-green-200' :
                            'bg-yellow-900/50 text-yellow-200'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatDate(item.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {item.sessionId.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {item.eventId ? item.eventId.substring(0, 8) + '...' : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {item.rating && (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                              item.rating === 'positive' 
                                ? 'bg-green-900/50 text-green-200' 
                                : 'bg-red-900/50 text-red-200'
                            }`}>
                              {item.rating}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-md truncate">
                            {item.content && (
                              <span className="text-sm text-gray-300">{item.content.substring(0, 60)}{item.content.length > 60 ? '...' : ''}</span>
                            )}
                            {item.comment && (
                              <span className="text-sm text-gray-300">"{item.comment.substring(0, 60)}{item.comment.length > 60 ? '...' : ''}"</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                        No feedback data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {activeTab === 'sessions' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-4 py-2 text-left">Session ID</th>
                  <th className="px-4 py-2 text-left">Start Time</th>
                  <th className="px-4 py-2 text-left">End Time</th>
                  <th className="px-4 py-2 text-left">Events</th>
                  <th className="px-4 py-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <tr key={session.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm">
                        {session.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(session.startTime)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {session.endTime ? formatDate(session.endTime) : 'Active'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-900/50 text-green-200">
                            {session.events.filter(e => e.type === 'user-input').length} inputs
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-200">
                            {session.events.filter(e => e.type === 'ai-output').length} outputs
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-200">
                            {session.events.filter(e => e.type === 'feedback').length} feedback
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-xs bg-blue-700/50 hover:bg-blue-700 text-blue-200 px-2 py-1 rounded"
                          onClick={() => {
                            // Filtered feedback to only show those from this session
                            setActiveTab('feedback');
                            setFilter('all');
                            setFilteredFeedback(feedback.filter(item => item.sessionId === session.id));
                          }}
                        >
                          View Events
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                      No session data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackDashboard; 
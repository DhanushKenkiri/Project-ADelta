import React, { useState, useEffect } from 'react';
import { useFeedback } from './FeedbackProvider';
import { 
  isFluvioEnabled, 
  setFluvioEnabled as setFluvioEnabledConfig, 
  getFluvioServerUrl, 
  setFluvioServerUrl, 
  testFluvioConnection 
} from '../config/fluvio';
import { fluvioService } from '../lib/fluvioService';

const FluvioAdmin: React.FC = () => {
  const { isFluvioEnabled: feedbackFluvioEnabled, setFluvioEnabled: setFeedbackFluvioEnabled } = useFeedback();
  const [isFluvioEnabled, setIsFluvioEnabled] = useState(isFluvioEnabled());
  const [serverUrl, setServerUrl] = useState(getFluvioServerUrl());
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [topicsStatus, setTopicsStatus] = useState<Record<string, boolean>>({});

  // Initialize connection status on component mount
  useEffect(() => {
    if (isFluvioEnabled) {
      checkConnectionStatus();
    }
  }, [isFluvioEnabled]);

  const checkConnectionStatus = async () => {
    if (!isFluvioEnabled) {
      setConnectionStatus('disconnected');
      return;
    }
    
    try {
      const connected = await fluvioService.ensureConnected();
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleFluvioToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newState = e.target.checked;
    setIsFluvioEnabled(newState);
    setFluvioEnabledConfig(newState);
    setFeedbackFluvioEnabled(newState);
    
    fluvioService.setEnabled(newState);
    
    if (!newState) {
      fluvioService.disconnect().catch(console.error);
      setConnectionStatus('disconnected');
    } else {
      fluvioService.init({ serverUrl }).catch(console.error);
    }
  };

  const handleServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerUrl(e.target.value);
  };

  const saveServerUrl = () => {
    setFluvioServerUrl(serverUrl);
    
    if (isFluvioEnabled) {
      fluvioService.init({ serverUrl }).catch(console.error);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('connecting');
    setErrorMessage('');
    
    try {
      await fluvioService.init({ serverUrl });
      const connected = await fluvioService.ensureConnected();
      
      if (connected) {
        setConnectionStatus('connected');
        
        // Test creating topics
        await testCreateTopics();
      } else {
        setConnectionStatus('error');
        setErrorMessage('Failed to connect to Fluvio server');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const testCreateTopics = async () => {
    // Try to send test messages to ensure topics are created
    const topics = [
      { name: 'Template Edits', key: 'template-edits' },
      { name: 'Cursor Positions', key: 'collaborative-cursors' },
      { name: 'User Feedback', key: 'user-feedback' }, 
      { name: 'User Sessions', key: 'user-sessions' }
    ];
    
    const newStatus: Record<string, boolean> = {};
    
    for (const topic of topics) {
      try {
        const testData = {
          id: 'test',
          timestamp: Date.now(),
          data: { message: `Test message for ${topic.name}` }
        };
        
        if (topic.key === 'template-edits') {
          await fluvioService.sendTemplateEdit({
            templateId: 'test',
            userId: 'system',
            username: 'System',
            timestamp: Date.now(),
            operation: 'insert',
            position: 0,
            content: 'Test content'
          });
        } else if (topic.key === 'collaborative-cursors') {
          await fluvioService.sendCursorPosition('test', 'system', 'System', 0);
        } else {
          // Use the private method via any typing to access the method
          await (fluvioService as any).sendToTopic(topic.key, testData);
        }
        
        newStatus[topic.key] = true;
      } catch (error) {
        console.error(`Error creating topic ${topic.key}:`, error);
        newStatus[topic.key] = false;
      }
    }
    
    setTopicsStatus(newStatus);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Fluvio Streaming Configuration</h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <div className="mr-3 text-gray-700 font-medium">Enable Fluvio Streaming</div>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isFluvioEnabled}
                onChange={handleFluvioToggle}
              />
              <div className={`block w-14 h-8 rounded-full ${isFluvioEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isFluvioEnabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>
          <div className="text-sm text-gray-500">
            {connectionStatus === 'connected' && (
              <span className="text-green-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connected
              </span>
            )}
            {connectionStatus === 'connecting' && (
              <span className="text-yellow-500 flex items-center">
                <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Connecting...
              </span>
            )}
            {connectionStatus === 'disconnected' && (
              <span className="text-gray-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Disconnected
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="text-red-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Connection Error
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="serverUrl">
          Fluvio Server URL
        </label>
        <div className="flex">
          <input
            id="serverUrl"
            type="text"
            className="shadow appearance-none border rounded-l py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
            placeholder="e.g., localhost:9003"
            value={serverUrl}
            onChange={handleServerUrlChange}
            disabled={!isFluvioEnabled}
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r focus:outline-none focus:shadow-outline"
            onClick={saveServerUrl}
            disabled={!isFluvioEnabled}
          >
            Save
          </button>
        </div>
      </div>
      
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}
      
      {Object.keys(topicsStatus).length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-2">Topics Status:</h3>
          <div className="bg-gray-100 p-3 rounded">
            <ul>
              {Object.entries(topicsStatus).map(([topic, status]) => (
                <li key={topic} className="flex items-center mb-1">
                  <span className={`w-4 h-4 rounded-full mr-2 ${status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="capitalize">{topic.replace('-', ' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-bold mb-2">Features Enabled:</h3>
        <div className="bg-gray-100 p-3 rounded">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Real-time collaborative template editing</span>
          </div>
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Cursor position tracking</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>User feedback loop</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          className={`${
            isFluvioEnabled 
              ? 'bg-blue-500 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
          onClick={testConnection}
          disabled={!isFluvioEnabled || isTestingConnection}
        >
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          className={`${
            connectionStatus === 'connected' 
              ? 'bg-red-500 hover:bg-red-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
          onClick={() => {
            fluvioService.disconnect().catch(console.error);
            setConnectionStatus('disconnected');
          }}
          disabled={connectionStatus !== 'connected'}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default FluvioAdmin; 
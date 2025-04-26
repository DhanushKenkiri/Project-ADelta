// Import only if not in browser environment - this prevents the dynamic require error
let Fluvio: any;
try {
  if (typeof window === 'undefined') {
    // Server-side only import
    Fluvio = require('@fluvio/client').default;
  } else {
    // In browser, we'll use a mock
    Fluvio = null;
  }
} catch (error) {
  console.warn('Fluvio client import failed, using mock implementation', error);
  Fluvio = null;
}

import type { FeedbackItem, FeedbackSession } from './feedbackLoop';
import { getFluvioServerUrl } from '../config/fluvio';
import { getCurrentUser } from './firebase';

// Topic names for different event types
const TOPICS = {
  USER_INPUT: 'user-inputs',
  AI_OUTPUT: 'ai-outputs',
  FEEDBACK: 'user-feedback',
  SESSIONS: 'user-sessions',
  EVENTS: 'all-events',
  TEMPLATE_EDITS: 'template-edits',
  COLLABORATIVE_CURSORS: 'collaborative-cursors'
};

// Interface for template edit messages
export interface TemplateEdit {
  templateId: string;
  userId: string;
  username: string;
  timestamp: number;
  operation: 'insert' | 'delete' | 'replace' | 'cursor-move';
  position?: number;
  length?: number;
  content?: string;
  cursorPosition?: number;
}

// Generic interfaces for Fluvio interactions
interface FluvioClient {
  close: () => Promise<void>;
  topicProducer: (topic: string) => Promise<FluvioProducer>;
  partitionConsumer: (topic: string, partition: number) => Promise<FluvioConsumer>;
}

interface FluvioProducer {
  send: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

interface FluvioConsumer {
  createStream: () => Promise<FluvioStream>;
}

interface FluvioStream {
  [Symbol.asyncIterator]: () => AsyncIterator<FluvioRecord>;
}

interface FluvioRecord {
  valueString: () => string;
}

// In-memory storage for mock implementation
const mockStorage = {
  topics: new Map<string, any[]>(), // Store messages by topic
  subscribers: new Map<string, Array<(message: any) => void>>(),
  edits: new Map<string, TemplateEdit[]>(),
  cursors: new Map<string, Map<string, number>>()
};

/**
 * FluvioService that gracefully degrades to local-only mode in browsers
 */
class FluvioService {
  private client: FluvioClient | null = null;
  private producer: FluvioProducer | null = null;
  private consumer: FluvioConsumer | null = null;
  private stream: FluvioStream | null = null;
  private enabled = false;
  private errorLogged = false;
  private serverUrl = '';
  private isServerRunning = true;
  private producers: Record<string, FluvioProducer> = {};
  private connectedTopics: Set<string> = new Set();
  private subscribers: Record<string, ((data: any) => void)[]> = {};
  private isPlatformSupported = true;
  private compatibilityWarned = false;
  private useLocalMock = true;

  constructor() {
    // Check platform support immediately to avoid repeated checks
    this.isPlatformSupported = this.checkPlatformSupport();
    if (!this.isPlatformSupported) {
      console.warn('Fluvio service is not supported in this environment. Collaboration features will be disabled.');
    }

    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.useLocalMock = true;
      console.info('Running in browser environment, using local collaboration mock');
    } else {
      // We're in Node.js, check if Fluvio is available
      this.useLocalMock = !this.isPlatformSupported;
    }
    
    // Initialize the mock storage for all topics
    Object.values(TOPICS).forEach(topic => {
      if (!mockStorage.topics.has(topic)) {
        mockStorage.topics.set(topic, []);
      }
    });
    
    // Always enable the service, it will use mock implementation if needed
    this.enabled = true;
  }

  /**
   * Check if the platform supports Fluvio
   */
  private checkPlatformSupport(): boolean {
    try {
      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined';
      
      // Check if Fluvio is defined
      const isFluvioDefined = typeof Fluvio !== 'undefined' && Fluvio !== null;
      
      // If in browser and Fluvio isn't available, we're not supported
      if (isBrowser && !isFluvioDefined) {
        console.warn('Fluvio is not available in this browser environment');
        return false;
      }
      
      return isFluvioDefined;
    } catch (error) {
      console.warn('Error checking Fluvio platform support:', error);
      return false;
    }
  }

  /**
   * Initialize the Fluvio service
   */
  public async init(serverUrl: string): Promise<boolean> {
    this.serverUrl = serverUrl;
    
    if (this.useLocalMock) {
      console.log('Using local mock implementation for Fluvio');
      return true;
    }
    
    if (!this.isPlatformSupported) {
      console.warn('Skipping Fluvio initialization: platform not supported');
      return false;
    }
    
    if (!this.isServerRunning) {
      console.log('Fluvio server is not running, skipping initialization');
      return false;
    }

    try {
      const connected = await this.ensureConnected();
      return connected;
    } catch (error) {
      console.error('Error initializing Fluvio:', error);
      return false;
    }
  }

  /**
   * Ensure connection to Fluvio is established
   */
  public async ensureConnected(): Promise<boolean> {
    if (this.client) return true;
    if (this.useLocalMock) return true;
    if (!this.isPlatformSupported) return false;
    if (!this.enabled) return false;

    try {
      console.log(`Connecting to Fluvio at ${this.serverUrl}...`);
      
      // Use connect method with the appropriate arguments based on Fluvio's API
      // We're using any here to bypass TypeScript checking
      this.client = await (Fluvio as any).connect(this.serverUrl) as FluvioClient;
      
      console.log('Connected to Fluvio successfully');
      return true;
    } catch (error) {
      // Only log detailed error once to avoid flooding the console
      if (!this.compatibilityWarned) {
        console.error('Failed to connect to Fluvio:', error);
        this.compatibilityWarned = true;
      } else {
        console.warn('Failed to connect to Fluvio (compatibility issue)');
      }
      
      // Mark as unsupported if we get specific errors that indicate platform compatibility issues
      if (error instanceof Error && 
         (error.message.includes('Dynamic require') || 
          error.message.includes('Platform is not supported'))) {
        console.warn('Marking Fluvio as unsupported due to platform compatibility issues');
        this.isPlatformSupported = false;
        this.useLocalMock = true;
      }
      return false;
    }
  }

  /**
   * Disconnect from Fluvio
   */
  public async disconnect(): Promise<void> {
    if (this.useLocalMock) {
      console.log('Mock Fluvio disconnected');
      return;
    }
    
    if (!this.client) return;
    
    try {
      // Close all producers
      for (const topic of Object.keys(this.producers)) {
        await this.producers[topic].close();
      }
      this.producers = {};
      
      // Close client connection
      await this.client.close();
      this.client = null;
      this.connectedTopics.clear();
      console.log('Disconnected from Fluvio');
    } catch (error) {
      console.error('Error disconnecting from Fluvio:', error);
    }
  }

  /**
   * Set whether the Fluvio service is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log('Fluvio service enabled:', enabled);
    
    if (!enabled && this.client && !this.useLocalMock) {
      this.disconnect();
    }
  }

  /**
   * Check if the service is currently enabled
   */
  public isFluvioEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get a producer for a specific topic
   */
  private async getProducer(topic: string): Promise<FluvioProducer | null> {
    if (!this.enabled) return null;
    
    if (this.useLocalMock) {
      // Return a mock producer
      return {
        send: async (data: string) => {
          const parsedData = JSON.parse(data);
          const topicMessages = mockStorage.topics.get(topic) || [];
          topicMessages.push(parsedData);
          mockStorage.topics.set(topic, topicMessages);
          
          // Notify subscribers
          const subscribers = mockStorage.subscribers.get(topic) || [];
          subscribers.forEach(callback => {
            try {
              callback(parsedData);
            } catch (err) {
              console.error(`Error in mock subscriber callback for topic ${topic}:`, err);
            }
          });
        },
        close: async () => {}
      };
    }
    
    if (!this.client) {
      const connected = await this.ensureConnected();
      if (!connected) return null;
    }

    if (!this.producers[topic]) {
      try {
        this.producers[topic] = await this.client!.topicProducer(topic);
        this.connectedTopics.add(topic);
      } catch (error) {
        console.error(`Error creating producer for topic ${topic}:`, error);
        return null;
      }
    }
    
    return this.producers[topic];
  }

  /**
   * Send data to a specific topic
   */
  private async sendToTopic(topic: string, data: any): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const producer = await this.getProducer(topic);
      if (!producer) return false;

      // Convert data to JSON and send to topic
      const serializedData = JSON.stringify(data);
      await producer.send(serializedData);
      return true;
    } catch (error) {
      console.error(`Error sending to topic ${topic}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to a topic to receive updates
   */
  public subscribe(topic: string, callback: (data: any) => void): () => void {
    if (!this.enabled) {
      // Return a no-op unsubscribe function
      return () => {};
    }
    
    if (this.useLocalMock) {
      // Get current subscribers or initialize new array
      const subscribers = mockStorage.subscribers.get(topic) || [];
      subscribers.push(callback);
      mockStorage.subscribers.set(topic, subscribers);
      
      // Return unsubscribe function
      return () => {
        const currentSubscribers = mockStorage.subscribers.get(topic) || [];
        mockStorage.subscribers.set(
          topic, 
          currentSubscribers.filter(cb => cb !== callback)
        );
      };
    }
    
    if (!this.subscribers[topic]) {
      this.subscribers[topic] = [];
      // Start consuming if this is the first subscriber
      if (this.enabled && !this.useLocalMock) {
        this.startConsuming(topic).catch(err => {
          console.error(`Error starting consumer for topic ${topic}:`, err);
        });
      }
    }
    
    this.subscribers[topic].push(callback);
    
    // Return unsubscribe function
    return () => {
      if (!this.subscribers[topic]) return;
      
      this.subscribers[topic] = this.subscribers[topic].filter(cb => cb !== callback);
      
      // If no more subscribers, stop consuming
      if (this.subscribers[topic].length === 0) {
        delete this.subscribers[topic];
      }
    };
  }

  /**
   * Start consuming messages from a topic
   */
  private async startConsuming(topic: string): Promise<void> {
    if (!this.enabled || this.useLocalMock) {
      return;
    }

    try {
      // Ensure we're connected
      const connected = await this.ensureConnected();
      if (!connected) return;

      // Get consumer for the topic
      const consumer = await this.client!.partitionConsumer(topic, 0);
      const stream = await consumer.createStream();

      // Process messages asynchronously
      (async () => {
        try {
          for await (const record of stream) {
            try {
              const data = JSON.parse(record.valueString());
              
              // Notify all subscribers
              if (this.subscribers[topic]) {
                this.subscribers[topic].forEach(callback => {
                  try {
                    callback(data);
                  } catch (err) {
                    console.error(`Error in subscriber callback for topic ${topic}:`, err);
                  }
                });
              }
            } catch (err) {
              console.error(`Error parsing message from topic ${topic}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error processing stream for topic ${topic}:`, err);
          
          // If there are still subscribers, try to reconnect after a delay
          if (this.subscribers[topic]?.length > 0) {
            setTimeout(() => {
              this.startConsuming(topic).catch(console.error);
            }, 5000);
          }
        }
      })();
    } catch (err) {
      console.error(`Error setting up consumer for topic ${topic}:`, err);
      // If this is a platform compatibility issue, mark as unsupported
      if (err instanceof Error && 
         (err.message.includes('Dynamic require') || 
          err.message.includes('Platform is not supported'))) {
        console.warn('Marking Fluvio as unsupported due to platform compatibility issues');
        this.isPlatformSupported = false;
        this.useLocalMock = true;
      }
    }
  }

  /**
   * Send user input to the feedback stream
   */
  public async sendUserInput(sessionId: string, input: string, metadata?: any): Promise<boolean> {
    return this.sendToTopic(TOPICS.USER_INPUT, {
      sessionId,
      input,
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Send AI output to the feedback stream
   */
  public async sendAIOutput(sessionId: string, output: string, metadata?: any): Promise<boolean> {
    return this.sendToTopic(TOPICS.AI_OUTPUT, {
      sessionId,
      output,
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Send user feedback to the feedback stream
   */
  public async sendFeedback(sessionId: string, rating: number, comment?: string, metadata?: any): Promise<boolean> {
    return this.sendToTopic(TOPICS.FEEDBACK, {
      sessionId,
      rating,
      comment,
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Send session data to the sessions stream
   */
  public async sendSessionData(sessionId: string, data: any): Promise<boolean> {
    return this.sendToTopic(TOPICS.SESSIONS, {
      sessionId,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send template edit to the template-edits stream
   */
  public async sendTemplateEdit(edit: TemplateEdit): Promise<boolean> {
    return this.sendToTopic(TOPICS.TEMPLATE_EDITS, {
      templateId: edit.templateId,
      edit,
      timestamp: Date.now()
    });
  }

  /**
   * Subscribe to template edits
   */
  public subscribeToTemplateEdits(templateId: string, callback: (edit: TemplateEdit) => void): () => void {
    return this.subscribe(TOPICS.TEMPLATE_EDITS, (data) => {
      if (data.templateId === templateId) {
        callback(data.edit);
      }
    });
  }

  /**
   * Send cursor position update
   */
  public async sendCursorPosition(templateId: string, userId: string, username: string, position: number): Promise<boolean> {
    return this.sendToTopic(TOPICS.COLLABORATIVE_CURSORS, {
      templateId,
      userId,
      username,
      timestamp: Date.now(),
      operation: 'cursor-move',
      cursorPosition: position
    });
  }

  /**
   * Send cursor update to the cursor-updates stream
   */
  public async sendCursorUpdate(templateId: string, userId: string, position: number): Promise<boolean> {
    // Store in local mock storage if using mock implementation
    if (this.useLocalMock) {
      let templateCursors = mockStorage.cursors.get(templateId);
      if (!templateCursors) {
        templateCursors = new Map<string, number>();
        mockStorage.cursors.set(templateId, templateCursors);
      }
      templateCursors.set(userId, position);
    }
    
    return this.sendToTopic('cursor-updates', {
      templateId,
      userId,
      position,
      timestamp: Date.now()
    });
  }

  /**
   * Subscribe to cursor updates
   */
  public subscribeToCursorUpdates(templateId: string, callback: (userId: string, position: number) => void): () => void {
    // If using mock implementation, return cursor positions from memory
    if (this.useLocalMock) {
      const templateCursors = mockStorage.cursors.get(templateId);
      if (templateCursors) {
        // Immediately send existing cursor positions
        templateCursors.forEach((position, userId) => {
          setTimeout(() => callback(userId, position), 0);
        });
      }
    }
    
    return this.subscribe('cursor-updates', (data) => {
      if (data.templateId === templateId) {
        callback(data.userId, data.position);
      }
    });
  }
}

// Export a singleton instance
export const fluvioService = new FluvioService(); 
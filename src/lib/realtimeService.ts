import { io, Socket } from 'socket.io-client';
import { EventEmitter } from './EventEmitter';

// Define types for real-time events
export interface TemplateUpdate {
  templateId: string;
  html: string;
  userId: string;
  timestamp: number;
}

export interface RealtimeUser {
  id: string;
  name: string;
  isActive: boolean;
}

// Class to handle real-time collaborations
class RealtimeService extends EventEmitter {
  private socket: Socket | null = null;
  private isConnected = false;
  private sessionId = '';
  private userId = '';
  private serverUrl = '';
  private connectionFailed = false;
  private maxConnectionAttempts = 2;
  private connectionAttempts = 0;
  private useRealtime = false; // Flag to control if realtime should be used at all

  constructor() {
    super();
    // Generate a random user ID if none exists
    this.userId = localStorage.getItem('email_template_user_id') || 
                 `user_${Math.random().toString(36).substring(2, 9)}`;
    
    // Save the user ID for future sessions
    localStorage.setItem('email_template_user_id', this.userId);
    
    // Check if we should use realtime functionality
    this.checkRealtimeAvailability();
  }

  // Check if the realtime server is available and configure accordingly
  private async checkRealtimeAvailability(): Promise<void> {
    try {
      // Use hosted socket.io server URL from env variable or disable realtime if not available
      this.serverUrl = import.meta.env.VITE_SOCKET_SERVER_URL || '';
      
      if (!this.serverUrl) {
        console.log('No realtime server URL configured, disabling realtime features');
        this.useRealtime = false;
        return;
      }

      console.log(`Realtime server URL configured: ${this.serverUrl}`);
      
      // Test if the server is accessible with a simple fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        // Assume the server is available if the URL is configured
        // This lets us fall back to the socket connection mechanism for proper connection handling
        this.useRealtime = true;
        clearTimeout(timeoutId);
        
        console.log('Realtime features enabled, server will be tested on connection attempt');
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn('Realtime server check failed, but will attempt connection anyway:', error);
        this.useRealtime = true; // Still try to connect
      }
    } catch (error) {
      console.warn('Error checking realtime availability:', error);
      this.useRealtime = false;
    }
  }

  // Connect to the real-time server
  connect(sessionId: string, userName?: string): void {
    // If realtime is disabled, emit a fake connected event and return
    if (!this.useRealtime) {
      console.log('Realtime features are disabled, simulating connection');
      setTimeout(() => {
        this.isConnected = true;
        this.sessionId = sessionId;
        this.emit('connected', { userId: this.userId, sessionId });
      }, 500);
      return;
    }

    if (this.isConnected && this.sessionId === sessionId) {
      console.log('Already connected to this session');
      return;
    }

    // If we previously failed to connect to the server, don't try again
    if (this.connectionFailed) {
      console.log('Previous connection attempts failed, skipping reconnection');
      return;
    }

    // Check if we've exceeded max connection attempts
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.log('Max connection attempts reached, giving up');
      this.connectionFailed = true;
      this.fallbackToLocalMode(sessionId);
      return;
    }

    this.connectionAttempts++;
    this.sessionId = sessionId;
    
    try {
      console.log(`Attempting to connect to realtime server: ${this.serverUrl}`);
      
      // Create a socket connection with session information
      this.socket = io(this.serverUrl, {
        query: {
          sessionId,
          userId: this.userId,
          userName: userName || `Guest ${Math.floor(Math.random() * 1000)}`,
        },
        transports: ['polling', 'websocket'], // Try polling first as it's more reliable
        reconnectionAttempts: 2,  // Limit reconnection attempts
        timeout: 5000,            // Shorter timeout
        forceNew: true,           // Force a new connection
        autoConnect: true         // Auto connect
      });

      // Setup event listeners
      this.socket.on('connect', this.handleConnect.bind(this));
      this.socket.on('disconnect', this.handleDisconnect.bind(this));
      this.socket.on('template_update', this.handleTemplateUpdate.bind(this));
      this.socket.on('user_joined', this.handleUserJoined.bind(this));
      this.socket.on('user_left', this.handleUserLeft.bind(this));
      this.socket.on('error', this.handleError.bind(this));
      this.socket.on('connect_error', this.handleConnectionError.bind(this));
    } catch (error) {
      console.error('Error creating socket connection:', error);
      this.connectionFailed = true;
      this.fallbackToLocalMode(sessionId);
    }
  }

  // Fallback to local mode when connection fails
  private fallbackToLocalMode(sessionId: string): void {
    console.log('Falling back to local-only mode (no realtime collaboration)');
    this.useRealtime = false;
    this.isConnected = true; // Pretend we're connected
    this.sessionId = sessionId;
    this.emit('connected', { userId: this.userId, sessionId });
  }

  // Handle connection error
  private handleConnectionError(error: any): void {
    console.error('Real-time service connection error:', error);
    this.connectionFailed = true;
    this.isConnected = false;
    this.emit('connection_error', { error });
    
    // Clean up socket to prevent further connection attempts
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Fall back to local mode
    this.fallbackToLocalMode(this.sessionId);
  }

  // Disconnect from the real-time server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.sessionId = '';
  }

  // Send a template update to all connected users
  updateTemplate(html: string): void {
    // If realtime is disabled, just return silently
    if (!this.useRealtime) {
      return;
    }
    
    if (!this.isConnected || !this.socket) {
      console.warn('Not connected to real-time server');
      return;
    }

    const update: TemplateUpdate = {
      templateId: this.sessionId,
      html,
      userId: this.userId,
      timestamp: Date.now(),
    };

    try {
      this.socket.emit('template_update', update);
    } catch (error) {
      console.error('Error sending template update:', error);
    }
  }

  // Get the current user ID
  getUserId(): string {
    return this.userId;
  }

  // Get the current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Check if connected to real-time server
  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  // Handle connection to the server
  private handleConnect(): void {
    console.log('Connected to real-time server');
    this.isConnected = true;
    this.connectionFailed = false;
    this.emit('connected', { userId: this.userId, sessionId: this.sessionId });
  }

  // Handle disconnection from the server
  private handleDisconnect(): void {
    console.log('Disconnected from real-time server');
    this.isConnected = false;
    this.emit('disconnected');
  }

  // Handle incoming template updates
  private handleTemplateUpdate(update: TemplateUpdate): void {
    // Skip updates from the current user
    if (update.userId === this.userId) return;
    
    this.emit('template_updated', update);
  }

  // Handle user joining event
  private handleUserJoined(user: RealtimeUser): void {
    this.emit('user_joined', user);
  }

  // Handle user leaving event
  private handleUserLeft(user: RealtimeUser): void {
    this.emit('user_left', user);
  }

  // Handle errors
  private handleError(error: any): void {
    console.error('Real-time service error:', error);
    this.emit('error', error);
  }
}

// Singleton instance
const realtimeService = new RealtimeService();
export default realtimeService; 
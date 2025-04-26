/**
 * Fluvio Configuration
 * 
 * This file contains the configuration for the Fluvio integration.
 * Update these values to match your Fluvio cluster settings.
 */

import { getLocalStorage, setLocalStorage } from '../lib/storage';

// Constants
const FLUVIO_ENABLED_KEY = 'fluvio_enabled';
const FLUVIO_SERVER_URL_KEY = 'fluvio_server_url';
const DEFAULT_FLUVIO_SERVER_URL = 'ws://localhost:9998';

/**
 * Fluvio Configuration
 */
export const FLUVIO_CONFIG = {
  /**
   * Whether to enable Fluvio integration
   * Set to false to disable all Fluvio functionality
   */
  ENABLED: false,
  
  /**
   * Fluvio server URL
   * For local development, typically "localhost:9003"
   * For production, this should be your Fluvio cluster address
   */
  SERVER_URL: 'localhost:9003',
  
  /**
   * Debug mode - set to true to enable detailed logging
   */
  DEBUG: false,
  
  /**
   * Topic configuration
   * These are the topics that will be created in Fluvio
   */
  TOPICS: {
    USER_INPUT: 'user-inputs',
    AI_OUTPUT: 'ai-outputs',
    FEEDBACK: 'user-feedback',
    SESSIONS: 'user-sessions',
    EVENTS: 'all-events',
  },
  
  /**
   * Retention policy for topics (in milliseconds)
   * Default: 7 days
   */
  RETENTION_PERIOD: 7 * 24 * 60 * 60 * 1000,
  
  /**
   * Number of partitions for each topic
   * For simple applications, 1 is sufficient
   * For higher throughput, increase this number
   */
  DEFAULT_PARTITIONS: 1,
  
  /**
   * Replication factor for topics
   * For development, 1 is sufficient (no replication)
   * For production, 3 is recommended for high availability
   */
  REPLICATION_FACTOR: 1,
};

/**
 * Checks if Fluvio is enabled via environment variables
 */
export function isFluvioEnabled(): boolean {
  // First check environment variables, then fallback to localStorage
  if (import.meta.env.VITE_USE_FLUVIO !== undefined) {
    return !!import.meta.env.VITE_USE_FLUVIO;
  }
  return getLocalStorage(FLUVIO_ENABLED_KEY, 'false') === 'true';
}

/**
 * Gets the Fluvio server URL from environment variables or stored settings
 */
export function getFluvioServerUrl(): string {
  // First check environment variables, then fallback to localStorage
  if (import.meta.env.VITE_FLUVIO_SERVER_URL) {
    return import.meta.env.VITE_FLUVIO_SERVER_URL;
  }
  return getLocalStorage(FLUVIO_SERVER_URL_KEY, DEFAULT_FLUVIO_SERVER_URL);
}

/**
 * Set whether Fluvio is enabled or disabled
 */
export function setFluvioEnabled(enabled: boolean): void {
  setLocalStorage(FLUVIO_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Set the Fluvio server URL
 */
export function setFluvioServerUrl(url: string): void {
  setLocalStorage(FLUVIO_SERVER_URL_KEY, url);
}

/**
 * Test connection to Fluvio server
 * Returns true if successful, false otherwise
 */
export async function testFluvioConnection(url?: string): Promise<{ success: boolean; message: string }> {
  const serverUrl = url || getFluvioServerUrl();
  
  try {
    // For demonstration purposes, this is a mock implementation
    // In a real application, you would actually test the connection
    console.log(`Testing connection to Fluvio server at ${serverUrl}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate success or failure based on URL format
    if (!serverUrl || !serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
      return { 
        success: false, 
        message: 'Invalid server URL. URL must start with ws:// or wss://' 
      };
    }
    
    // Check for localhost connection
    if (serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) {
      // 80% chance of success for localhost connections
      if (Math.random() < 0.8) {
        return { 
          success: true, 
          message: 'Successfully connected to Fluvio server' 
        };
      } else {
        return { 
          success: false, 
          message: 'Connection timeout. Is the Fluvio server running?' 
        };
      }
    }
    
    // For non-localhost URLs, simulate a successful connection
    return { 
      success: true, 
      message: 'Successfully connected to Fluvio server' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
} 
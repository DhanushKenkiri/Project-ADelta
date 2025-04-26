/**
 * API Utility for handling API requests in both development and production environments
 * 
 * In development: Uses localhost:3000/api
 * In production: Uses Firebase Functions
 */

// Determine the base URL for API requests
export const getApiBaseUrl = (): string => {
  // Check if we're running in development mode
  const isDev = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';
  
  if (isDev) {
    // In development, use localhost
    return 'http://localhost:3000/api';
  } else {
    // In production, use the deployed API
    return '/api';
  }
};

/**
 * Make an API request with proper error handling
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}/${endpoint.replace(/^\//, '')}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Make a POST request to the API
 */
export async function apiPost<T>(
  endpoint: string, 
  data: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Make a GET request to the API
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint);
} 
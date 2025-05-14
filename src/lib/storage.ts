/**
 * Get a value from localStorage with a fallback if not found
 */
export function getLocalStorage(key: string, fallback: string = ''): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value !== null ? value : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage: ${error}`);
    return fallback;
  }
}

/**
 * Set a value in localStorage
 */
export function setLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error writing to localStorage: ${error}`);
  }
}

/**
 * Remove a value from localStorage
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage: ${error}`);
  }
}

/**
 * Clear all values from localStorage
 */
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage', error);
  }
} 
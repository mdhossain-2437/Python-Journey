/**
 * Secure Storage Utility
 *
 * Provides a bulletproof storage abstraction that:
 * - Works in all browser contexts (including private browsing, iframes, etc.)
 * - Never throws unhandled errors
 * - Gracefully falls back to in-memory storage when localStorage is unavailable
 * - Suppresses console errors from storage access attempts
 */

// In-memory fallback storage
const memoryStore = new Map<string, string>();

// Track whether we've already determined localStorage availability
let localStorageAvailable: boolean | null = null;

/**
 * Safely check if localStorage is available
 * Returns cached result after first check
 */
function checkLocalStorageAvailable(): boolean {
  if (localStorageAvailable !== null) {
    return localStorageAvailable;
  }

  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      localStorageAvailable = false;
      return false;
    }

    // Try to actually use localStorage
    const testKey = '__llmforge_storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    localStorageAvailable = true;
    return true;
  } catch {
    // Any error means localStorage is not available
    localStorageAvailable = false;
    return false;
  }
}

/**
 * SecureStorage class - singleton pattern
 */
class SecureStorageImpl {
  /**
   * Get an item from storage
   */
  getItem(key: string): string | null {
    // First check memory (fastest)
    const memValue = memoryStore.get(key);
    if (memValue !== undefined) {
      return memValue;
    }

    // Try localStorage if available
    if (checkLocalStorageAvailable()) {
      try {
        const value = window.localStorage.getItem(key);
        if (value !== null) {
          // Sync to memory for faster future access
          memoryStore.set(key, value);
        }
        return value;
      } catch {
        // Silent fail - return null
      }
    }

    return null;
  }

  /**
   * Set an item in storage
   */
  setItem(key: string, value: string): void {
    // Always store in memory first (guaranteed to work)
    memoryStore.set(key, value);

    // Try localStorage if available
    if (checkLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Silent fail - data is safely in memory
      }
    }
  }

  /**
   * Remove an item from storage
   */
  removeItem(key: string): void {
    // Remove from memory
    memoryStore.delete(key);

    // Try to remove from localStorage
    if (checkLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Silent fail
      }
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    memoryStore.clear();

    if (checkLocalStorageAvailable()) {
      try {
        // Only clear our keys, not all localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key?.startsWith('llmf_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
      } catch {
        // Silent fail
      }
    }
  }

  /**
   * Check if persistent storage is available
   */
  isPersistent(): boolean {
    return checkLocalStorageAvailable();
  }

  /**
   * Get all keys in storage
   */
  keys(): string[] {
    return Array.from(memoryStore.keys());
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageImpl();

// Also export as default
export default secureStorage;


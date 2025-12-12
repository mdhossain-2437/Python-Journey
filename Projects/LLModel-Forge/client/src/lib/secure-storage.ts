// Secure storage utility with fallback for restricted contexts
// Handles "Access to storage is not allowed from this context" errors

class SecureStorage {
  private memoryStorage: Map<string, string> = new Map();
  private storageAvailable: boolean | null = null;

  private isStorageAvailable(): boolean {
    // Return cached result
    if (this.storageAvailable !== null) {
      return this.storageAvailable;
    }

    // Check if window and localStorage exist
    if (typeof window === 'undefined') {
      this.storageAvailable = false;
      return false;
    }

    try {
      const storage = window.localStorage;
      const testKey = '__llmf_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      this.storageAvailable = true;
      return true;
    } catch (e) {
      // Storage not available (private mode, iframe, etc.)
      this.storageAvailable = false;
      return false;
    }
  }

  getItem(key: string): string | null {
    // Try memory first
    const memValue = this.memoryStorage.get(key);
    if (memValue !== undefined) {
      return memValue;
    }

    // Try localStorage if available
    if (this.isStorageAvailable()) {
      try {
        const value = window.localStorage.getItem(key);
        if (value !== null) {
          // Cache in memory
          this.memoryStorage.set(key, value);
        }
        return value;
      } catch {
        // Silent fail
      }
    }
    return null;
  }

  setItem(key: string, value: string): void {
    // Always store in memory
    this.memoryStorage.set(key, value);

    // Also try localStorage
    if (this.isStorageAvailable()) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Silent fail - data is in memory
      }
    }
  }

  removeItem(key: string): void {
    this.memoryStorage.delete(key);

    if (this.isStorageAvailable()) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Silent fail
      }
    }
  }

  clear(): void {
    this.memoryStorage.clear();

    if (this.isStorageAvailable()) {
      try {
        window.localStorage.clear();
      } catch {
        // Silent fail
      }
    }
  }
}

export const secureStorage = new SecureStorage();


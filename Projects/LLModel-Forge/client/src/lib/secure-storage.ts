// Secure storage utility with fallback for restricted contexts
// Handles "Access to storage is not allowed from this context" errors

class SecureStorage {
  private memoryStorage: Map<string, string> = new Map();
  private isLocalStorageAvailable: boolean = false;
  private hasChecked: boolean = false;

  private checkLocalStorageAvailability(): boolean {
    if (this.hasChecked) {
      return this.isLocalStorageAvailable;
    }

    this.hasChecked = true;

    try {
      // Check if we're in a context where localStorage is available
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false;
      }

      const testKey = '__llmf_storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
      return true;
    } catch (e) {
      // localStorage is not available (private browsing, iframe restrictions, etc.)
      this.isLocalStorageAvailable = false;
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.checkLocalStorageAvailability()) {
      try {
        return localStorage.getItem(key);
      } catch {
        return this.memoryStorage.get(key) || null;
      }
    }
    return this.memoryStorage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    // Always store in memory as backup
    this.memoryStorage.set(key, value);

    if (this.checkLocalStorageAvailability()) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silently fail - data is in memory storage
      }
    }
  }

  removeItem(key: string): void {
    this.memoryStorage.delete(key);

    if (this.checkLocalStorageAvailability()) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently fail
      }
    }
  }

  clear(): void {
    this.memoryStorage.clear();

    if (this.checkLocalStorageAvailability()) {
      try {
        localStorage.clear();
      } catch {
        // Silently fail
      }
    }
  }

  // Check if persistent storage is available
  isPersistent(): boolean {
    return this.checkLocalStorageAvailability();
  }
}

export const secureStorage = new SecureStorage();


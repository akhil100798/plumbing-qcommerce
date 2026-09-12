function webStorage(): Storage | null {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

const memoryStore = new Map<string, string>();

export const tokenStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const storage = webStorage();
      if (storage) {
        return storage.getItem(key);
      }
      return memoryStore.get(key) || null;
    } catch {
      return memoryStore.get(key) || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = webStorage();
      if (storage) {
        storage.setItem(key, value);
        return;
      }
      memoryStore.set(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      const storage = webStorage();
      if (storage) {
        storage.removeItem(key);
        return;
      }
      memoryStore.delete(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

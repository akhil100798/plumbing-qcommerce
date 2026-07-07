import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

function webStorage(): Storage | null {
  if (Platform.OS !== 'web') {
    return null;
  }
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  return globalThis.localStorage;
}

export const tokenStorage = {
  async getItem(key: string): Promise<string | null> {
    const storage = webStorage();
    if (storage) {
      return storage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const storage = webStorage();
    if (storage) {
      storage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    const storage = webStorage();
    if (storage) {
      storage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
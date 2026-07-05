import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = {
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
};

function installWebStorage() {
  const values = new Map<string, string>();
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
  return storage;
}

async function loadTokenStorage(platform: 'web' | 'ios') {
  vi.resetModules();
  secureStore.getItemAsync.mockReset();
  secureStore.setItemAsync.mockReset();
  secureStore.deleteItemAsync.mockReset();
  vi.doMock('react-native', () => ({ Platform: { OS: platform } }));
  vi.doMock('expo-secure-store', () => secureStore);
  return import('./tokenStorage');
}

describe('store tokenStorage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses web storage without calling SecureStore on web', async () => {
    const webStorage = installWebStorage();
    const { tokenStorage } = await loadTokenStorage('web');

    await tokenStorage.setItem('authToken', 'opaque-local-token');
    const token = await tokenStorage.getItem('authToken');
    await tokenStorage.deleteItem('authToken');

    expect(token).toBe('opaque-local-token');
    expect(webStorage.setItem).toHaveBeenCalledWith('authToken', 'opaque-local-token');
    expect(webStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(secureStore.getItemAsync).not.toHaveBeenCalled();
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('keeps using SecureStore on native platforms', async () => {
    const { tokenStorage } = await loadTokenStorage('ios');
    secureStore.getItemAsync.mockResolvedValue('native-token');

    await tokenStorage.setItem('authToken', 'native-token');
    const token = await tokenStorage.getItem('authToken');
    await tokenStorage.deleteItem('authToken');

    expect(token).toBe('native-token');
    expect(secureStore.setItemAsync).toHaveBeenCalledWith('authToken', 'native-token');
    expect(secureStore.getItemAsync).toHaveBeenCalledWith('authToken');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
  });
});
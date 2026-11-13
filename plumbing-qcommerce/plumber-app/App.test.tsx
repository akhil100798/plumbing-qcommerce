// @ts-ignore
(globalThis as any).__DEV__ = true;

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';

vi.mock('./src/services/api/tokenStorage', () => ({
  tokenStorage: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));

vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: vi.fn(async () => ({ coords: { latitude: 12.9716, longitude: 77.5946 } })),
  watchPositionAsync: vi.fn(),
}));

vi.mock('expo-image-picker', () => ({
  launchCameraAsync: vi.fn(async () => ({ canceled: true })),
  launchImageLibraryAsync: vi.fn(async () => ({ canceled: true })),
}));

vi.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

vi.mock('react-native', async () => {
  function AnimatedValue(this: any) {
    this.setValue = vi.fn();
    this.interpolate = vi.fn(() => ({ __val: 0 }));
    this.addListener = vi.fn();
    this.removeAllListeners = vi.fn();
  }
  const animOp = () => ({ start: vi.fn(), stop: vi.fn(), reset: vi.fn() });
  return {
    ActivityIndicator: 'ActivityIndicator',
    Alert: { alert: vi.fn() },
    Image: 'Image',
    Pressable: 'Pressable',
    SafeAreaView: 'SafeAreaView',
    ScrollView: 'ScrollView',
    StyleSheet: { create: (styles: unknown) => styles, flatten: (s: unknown) => s },
    Switch: 'Switch',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    View: 'View',
    Dimensions: { get: vi.fn(() => ({ width: 375, height: 812 })) },
    Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    StatusBar: 'StatusBar',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Animated: {
      Value: AnimatedValue,
      ValueXY: vi.fn().mockImplementation(function(this: any) {
        this.x = new (AnimatedValue as any)();
        this.y = new (AnimatedValue as any)();
        this.setValue = vi.fn();
      }),
      timing: vi.fn(() => animOp()),
      spring: vi.fn(() => animOp()),
      decay: vi.fn(() => animOp()),
      parallel: vi.fn(() => animOp()),
      sequence: vi.fn(() => animOp()),
      loop: vi.fn(() => animOp()),
      View: 'View',
      Text: 'Text',
      Image: 'Image',
    },
  };
});

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: vi.fn(), goBack: vi.fn(), setOptions: vi.fn() }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: vi.fn((cb) => cb()),
  NavigationContainer: ({ children }: any) => children,
}));

vi.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

vi.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const App = () => null;
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';
import { store } from './src/redux/store';

describe('plumber app tests', () => {
  it('renders the initial App wrapper', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(<App />);
    });
    expect(tree).toBeDefined();
  });

  it('renders the DashboardScreen', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <Provider store={store}>
          <DashboardScreen navigation={{ navigate: vi.fn() } as any} route={{ key: 'd', name: 'Dashboard' } as any} />
        </Provider>
      );
    });
    expect(tree).toBeDefined();
  });

  it('renders the ProfileScreen with KYC section', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <Provider store={store}>
          <ProfileScreen navigation={{ navigate: vi.fn() } as any} route={{ key: 'p', name: 'Profile' } as any} />
        </Provider>
      );
    });
    expect(tree).toBeDefined();
  });
});

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';

vi.stubGlobal('__DEV__', true);

import App from './App';
import { HomeScreen } from './src/screens/HomeScreen';
import { store } from './src/redux/store';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Alert: { alert: vi.fn() },
  Platform: { OS: 'ios' },
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('socket.io-client', () => ({
  default: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn(),
  getStringAsync: vi.fn(),
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(() => Promise.resolve(null)),
  setItemAsync: vi.fn(() => Promise.resolve()),
  deleteItemAsync: vi.fn(() => Promise.resolve()),
}));

vi.mock('expo-linking', () => ({
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  createURL: vi.fn((path: string) => 'plumbcommerce://' + path),
  getInitialURL: vi.fn(() => Promise.resolve(null)),
  openURL: vi.fn(() => Promise.resolve()),
}));


// Mock React Navigation since it is not used in the test rendering directly
vi.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: vi.fn(),
    dispatch: vi.fn(),
    goBack: vi.fn(),
  }),
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

vi.mock('react-native-maps', () => ({
  default: 'MapView',
  MapView: 'MapView',
  Marker: 'Marker',
  Polyline: 'Polyline',
}));



describe('customer app', () => {
  it('renders the initial App wrapper', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<App />);
    });
    const tree = renderer!.toJSON();
    expect(tree).toBeDefined();
  });

  it('renders the customer request workflow on HomeScreen', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <Provider store={store}>
          <HomeScreen navigation={{ navigate: vi.fn() }} />
        </Provider>
      );
    });
    const tree = renderer!.toJSON();

    expect(JSON.stringify(tree)).toContain('Plumbing Emergency?');
    expect(JSON.stringify(tree)).toContain('Quick plumber');
    expect(JSON.stringify(tree)).toContain('Store assisted repair');
    expect(JSON.stringify(tree)).toContain('Find plumber');
  });
});

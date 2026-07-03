import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';

import App from './App';
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';
import { store } from './src/redux/store';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Switch: 'Switch',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  Platform: { OS: 'web' },
  StatusBar: 'StatusBar',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
}));

vi.mock('socket.io-client', () => ({
  default: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(() => Promise.resolve(null)),
  setItemAsync: vi.fn(() => Promise.resolve()),
  deleteItemAsync: vi.fn(() => Promise.resolve()),
}));

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

describe('plumber app tests', () => {
  it('renders the initial App wrapper', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<App />);
    });
    const tree = renderer!.toJSON();
    expect(tree).toBeDefined();
  });

  it('renders the DashboardScreen', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <Provider store={store}>
          <DashboardScreen navigation={{ navigate: vi.fn() } as any} route={{} as any} />
        </Provider>
      );
    });
    const tree = renderer!.toJSON();

    expect(JSON.stringify(tree)).toContain('PlumbCommerce');
    expect(JSON.stringify(tree)).toContain('Today\'s Earnings');
    expect(JSON.stringify(tree)).toContain('Quick Actions');
  });

  it('renders the ProfileScreen with Availability Status option', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <Provider store={store}>
          <ProfileScreen navigation={{ navigate: vi.fn() } as any} route={{} as any} />
        </Provider>
      );
    });
    const tree = renderer!.toJSON();

    expect(JSON.stringify(tree)).toContain('Availability Status');
    expect(JSON.stringify(tree)).toContain('Bank Details');
  });
});

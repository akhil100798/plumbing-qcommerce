import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';

import App from './App';
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { OrdersScreen } from './src/screens/orders/OrdersScreen';
import { InventoryScreen } from './src/screens/inventory/InventoryScreen';
import { store } from './src/redux/store';
import { theme } from './src/theme';

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
    Pressable: 'Pressable',
    SafeAreaView: 'SafeAreaView',
    ScrollView: 'ScrollView',
    StyleSheet: { create: (styles: unknown) => styles, flatten: (s: unknown) => s },
    Switch: 'Switch',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    View: 'View',
    Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    StatusBar: 'StatusBar',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    FlatList: 'FlatList',
    Modal: 'Modal',
    Image: 'Image',
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
      ScrollView: 'ScrollView',
      FlatList: 'FlatList',
      createAnimatedComponent: vi.fn((c: any) => c),
      event: vi.fn(() => vi.fn()),
      add: vi.fn((a: any) => a),
    },
  };
});

vi.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
}));

vi.mock('socket.io-client', () => ({
  default: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(() => Promise.resolve(null)),
  setItemAsync: vi.fn(() => Promise.resolve()),
  deleteItemAsync: vi.fn(() => Promise.resolve()),
}));

vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn(() => Promise.resolve(true)),
  getStringAsync: vi.fn(() => Promise.resolve('')),
}));

vi.mock('react-native-maps', () => ({
  default: 'MapView',
  Marker: 'Marker',
  Circle: 'Circle',
  Polyline: 'Polyline',
}));

vi.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: vi.fn(),
    dispatch: vi.fn(),
    goBack: vi.fn(),
  }),
  useIsFocused: () => true,
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

describe('store app release gate tests', () => {
  it('verifies that theme tokens import correctly', () => {
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.borderRadius).toBeDefined();
  });

  it('renders the main App wrapper', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<App />);
    });
    const tree = renderer!.toJSON();
    expect(tree).toBeDefined();
  });

  it('renders the LoginScreen', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <Provider store={store}>
          <LoginScreen />
        </Provider>
      );
    });
    const tree = renderer!.toJSON();
    expect(tree).toBeDefined();
  });

  it('renders the DashboardScreen', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <Provider store={store}>
          <DashboardScreen />
        </Provider>
      );
    });
    const tree = renderer!.toJSON();
    expect(tree).toBeDefined();
  });

  it('renders the OrdersScreen', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <Provider store={store}>
          <OrdersScreen />
        </Provider>
      );
    });
    const tree = renderer!.toJSON();
    expect(tree).toBeDefined();
  });

  it('renders the InventoryScreen', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <Provider store={store}>
          <InventoryScreen />
        </Provider>
      );
    });
    const tree = renderer!.toJSON();
    expect(tree).toBeDefined();
  });
});

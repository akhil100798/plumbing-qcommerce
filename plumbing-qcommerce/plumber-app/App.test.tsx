import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  StyleSheet: { create: (styles: unknown) => styles },
  Switch: 'Switch',
  Text: 'Text',
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

vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
}));

describe('plumber app', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        token: 'plumber-token',
        email: 'plumber1@plumb.local',
      }),
    })));
  });

  it('renders the plumber availability screen', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<App />);
    });
    const tree = renderer!.toJSON();

    expect(JSON.stringify(tree)).toContain('PlumbCommerce | Partner');
    expect(JSON.stringify(tree)).toContain('Availability Status');
    expect(JSON.stringify(tree)).toContain('OFFLINE');
  });
});

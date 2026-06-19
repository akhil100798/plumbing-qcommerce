import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Platform: { OS: 'web' },
  StyleSheet: { create: (styles: unknown) => styles },
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

describe('customer app', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        token: 'customer-token',
        email: 'customer@plumb.local',
      }),
    })));
  });

  it('renders the customer request workflow', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<App />);
    });
    const tree = renderer!.toJSON();

    expect(JSON.stringify(tree)).toContain('PlumbCommerce');
    expect(JSON.stringify(tree)).toContain('Quick Assign');
    expect(JSON.stringify(tree)).toContain('Pick a Store');
  });
});

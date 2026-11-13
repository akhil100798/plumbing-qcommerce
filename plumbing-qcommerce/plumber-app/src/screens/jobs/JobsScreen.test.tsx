import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  apiGet: vi.fn(),
}));

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));

vi.mock('../../services/api/axiosClient', () => ({
  apiClient: { get: mocks.apiGet },
}));

vi.mock('react-native', () => {
  const React = require('react');
  return {
    View: 'View',
    Text: 'Text',
    ActivityIndicator: 'ActivityIndicator',
    TouchableOpacity: ({ onPress, children, ...props }: any) =>
      React.createElement('TouchableOpacity', { onPress, ...props }, children),
    FlatList: ({ data, renderItem, ListEmptyComponent }: any) => {
      if (!data || data.length === 0) return ListEmptyComponent || null;
      return React.createElement(
        'View',
        null,
        data.map((item: any, idx: number) =>
          React.createElement('View', { key: idx }, renderItem({ item, index: idx }))
        )
      );
    },
    StyleSheet: { create: (value: unknown) => value },
  };
});

import { JobsScreen } from './JobsScreen';

describe('JobsScreen navigation regression', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.apiGet.mockReset();
  });

  it('navigates to ActiveJob with stringified jobId when job has jobId = 123', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      data: [{ jobId: 123, description: 'Pipe repair', status: 'ACCEPTED', totalAmount: 450 }],
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<JobsScreen route={{} as any} navigation={{} as any} />);
    });

    const card = renderer.root.findAllByType('TouchableOpacity' as any)[0];
    expect(card).toBeDefined();

    act(() => {
      card.props.onPress();
    });

    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith('ActiveJob', { jobId: '123' });
  });

  it('does not navigate to ActiveJob when job has undefined ID', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      data: [{ description: 'Missing id job', status: 'ACCEPTED', totalAmount: 0 }],
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<JobsScreen route={{} as any} navigation={{} as any} />);
    });

    const card = renderer.root.findAllByType('TouchableOpacity' as any)[0];
    expect(card).toBeDefined();

    act(() => {
      card.props.onPress();
    });

    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('supports legacy id fallback if jobId is absent', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      data: [{ id: 456, description: 'Legacy id job', status: 'ACCEPTED', totalAmount: 300 }],
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<JobsScreen route={{} as any} navigation={{} as any} />);
    });

    const card = renderer.root.findAllByType('TouchableOpacity' as any)[0];
    expect(card).toBeDefined();

    act(() => {
      card.props.onPress();
    });

    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith('ActiveJob', { jobId: '456' });
  });
});

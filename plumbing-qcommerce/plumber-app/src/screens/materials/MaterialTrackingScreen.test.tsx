import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  arrive: vi.fn(),
  collect: vi.fn(),
  alert: vi.fn(),
}));

vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  ScrollView: 'scroll-view',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'text',
  TouchableOpacity: 'touchable-opacity',
  View: 'view',
}));

vi.mock('../../components/common/AppHeader', () => ({ AppHeader: () => React.createElement('header') }));
vi.mock('../../components/common/FeedbackStates', () => ({
  ErrorState: () => React.createElement('error-state'),
  LoadingState: () => React.createElement('loading-state'),
}));
vi.mock('../../components/common/PrimaryButton', () => ({
  PrimaryButton: (props: any) => React.createElement('primary-button', props),
}));
vi.mock('../../components/common/ScreenWrapper', () => ({
  ScreenWrapper: ({ children }: any) => React.createElement('screen-wrapper', null, children),
}));
vi.mock('../../components/common/StatusChip', () => ({ StatusChip: (props: any) => React.createElement('status-chip', props) }));
vi.mock('../../services/materials/materialService', () => ({
  materialService: {
    fetchMaterialDetails: mocks.fetch,
    markArrivedAtStore: mocks.arrive,
    confirmCollection: mocks.collect,
    cancelMaterialRequest: vi.fn(),
    resumeWork: vi.fn(),
  },
}));
vi.mock('../materials/materialResumeRoute', () => ({ materialResumeRoute: vi.fn(() => ({ name: 'StartWork', params: { jobId: '33' } })) }));
vi.mock('../../theme', () => ({
  colors: {
    surface: '#fff', primary: '#00f', textPrimary: '#000', textSecondary: '#666',
    warningContainer: '#fff', warning: '#f90', primaryLight: '#eef', primaryContainer: '#ccf',
    successLight: '#efe', success: '#0a0', border: '#ddd', borderDark: '#aaa',
  },
  spacing: { layout: 1, giant: 1, md: 1, sm: 1, xs: 1, xl: 1 },
  typography: { fontSize: { md: 1, sm: 1, xs: 1 }, fontWeight: { bold: '700' } },
  borderRadius: { md: 1, lg: 1 },
  shadows: { md: {}, sm: {} },
}));

import { MaterialTrackingScreen } from './MaterialTrackingScreen';

const detail = (status: string, overrides: Record<string, unknown> = {}) => ({
  id: 11,
  status,
  storeName: 'QA Material Store',
  storeAddress: 'QA address',
  totalAmount: 145,
  items: [{ productName: 'Pipe', requestedQuantity: 1, reservedQuantity: 1 }],
  ...overrides,
});

const renderScreen = async () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <MaterialTrackingScreen
        route={{ params: { jobId: '33', productOrderId: 11 } } as any}
        navigation={{ goBack: vi.fn(), navigate: vi.fn(), canGoBack: () => true } as any}
      />,
    );
  });
  return renderer;
};

describe('MaterialTrackingScreen pickup state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('setInterval', vi.fn(() => 1));
    vi.stubGlobal('clearInterval', vi.fn());
    mocks.arrive.mockResolvedValue(undefined);
    mocks.collect.mockResolvedValue(undefined);
  });

  it('shows arrival and hides collection before arrival', async () => {
    mocks.fetch.mockResolvedValue(detail('READY_FOR_PICKUP'));
    const renderer = await renderScreen();

    expect(renderer.root.findAllByProps({ title: "I've Arrived at the Store" }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ title: "I've Collected Materials from Store" })).toHaveLength(0);
  });

  it('uses persisted arrival to unlock collection after reload', async () => {
    mocks.fetch.mockResolvedValue(detail('PLUMBER_AT_STORE', { plumberArrivedAt: '2026-09-23T16:42:00Z' }));
    const renderer = await renderScreen();

    expect(renderer.root.findAllByProps({ title: "I've Arrived at the Store" })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ title: "I've Collected Materials from Store" }).length).toBeGreaterThan(0);
  });

  it('keeps collection unavailable when arrival fails', async () => {
    mocks.fetch.mockResolvedValue(detail('READY_FOR_PICKUP'));
    mocks.arrive.mockRejectedValue(new Error('Arrival rejected'));
    const renderer = await renderScreen();
    const arrival = renderer.root.findByProps({ title: "I've Arrived at the Store" });

    await act(async () => { await arrival.props.onPress(); });

    expect(mocks.collect).not.toHaveBeenCalled();
    expect(mocks.alert).toHaveBeenCalledWith('Error', 'Arrival rejected');
    expect(renderer.root.findAllByProps({ title: "I've Collected Materials from Store" })).toHaveLength(0);
  });

  it('collects only from the persisted arrived state', async () => {
    mocks.fetch.mockResolvedValueOnce(detail('PLUMBER_AT_STORE', { plumberArrivedAt: '2026-09-23T16:42:00Z' }))
      .mockResolvedValueOnce(detail('COLLECTED', {
        plumberArrivedAt: '2026-09-23T16:42:00Z',
        plumberCollectedAt: '2026-09-23T16:43:00Z',
      }));
    const renderer = await renderScreen();
    const collection = renderer.root.findByProps({ title: "I've Collected Materials from Store" });

    await act(async () => { await collection.props.onPress(); });

    expect(mocks.collect).toHaveBeenCalledOnce();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });
});

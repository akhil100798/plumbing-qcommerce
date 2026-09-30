import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  __dev: (() => { (globalThis as any).__DEV__ = true; return true; })(),
  markArrived: vi.fn(),
  alert: vi.fn(),
  dispatch: vi.fn(),
  activeJob: {
    customer: { fullName: null, phone: null },
  } as { customer: { fullName: string | null; phone: string | null } },
}));

vi.mock('../../services/jobs/jobService', () => ({ jobService: { markArrived: mocks.markArrived } }));
vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (selector: any) => selector({ job: { activeJob: mocks.activeJob } }),
}));
vi.mock('expo-secure-store', () => ({ getItemAsync: vi.fn(), setItemAsync: vi.fn(), deleteItemAsync: vi.fn() }));
vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  SafeAreaView: 'SafeAreaView', View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity',
  Platform: { OS: 'ios' },
  StyleSheet: { create: (value: unknown) => value },
}));
vi.mock('../../components/common/AppHeader', () => ({ AppHeader: ({ title }: any) => React.createElement('Text', null, title) }));
vi.mock('../../components/maps/RouteMap', () => ({ RouteMap: (props: any) => React.createElement('RouteMap', props) }));
vi.mock('../../assets/icons/arrow-right.svg', () => ({ default: 'ArrowRightIcon' }));
vi.mock('../../assets/icons/navigation.svg', () => ({ default: 'NavigationIcon' }));
vi.mock('../../assets/icons/phone.svg', () => ({ default: 'PhoneIcon' }));
vi.mock('../../assets/icons/location-pin.svg', () => ({ default: 'LocationPinIcon' }));

import { NavigationScreen } from './NavigationScreen';

function render(params: Record<string, unknown> = {}) {
  const navigation = { goBack: vi.fn(), replace: vi.fn() };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(
      <NavigationScreen
        route={{ params: { jobId: 'job-42', customerId: 'customer-7', address: 'Address', ...params } } as any}
        navigation={navigation as any}
      />,
    ); });
  return { renderer, navigation };
}

function buttons(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType('TouchableOpacity' as any);
}

describe('NavigationScreen Phase 1 boundaries', () => {
  beforeEach(() => {
    mocks.markArrived.mockReset();
    mocks.alert.mockReset();
    mocks.dispatch.mockReset();
    mocks.activeJob.customer.fullName = null;
    mocks.activeJob.customer.phone = null;
  });

  it('calls markArrived with the real job ID and navigates once after success', async () => {
    mocks.markArrived.mockResolvedValueOnce({ status: 200 });
    const { renderer, navigation } = render({ latitude: 12.9716, longitude: 77.5946, plumberLatitude: 12.9616, plumberLongitude: 77.5846 });

    await act(async () => { await buttons(renderer).at(-1)!.props.onPress(); await Promise.resolve(); });

    expect(mocks.markArrived).toHaveBeenCalledOnce();
    expect(mocks.markArrived).toHaveBeenCalledWith('job-42');
    expect(navigation.replace).toHaveBeenCalledOnce();
    expect(navigation.replace).toHaveBeenCalledWith('ReachedCustomer', { jobId: 'job-42' });
  });

  it('keeps the user on NavigationScreen and allows retry after arrival failure', async () => {
    mocks.markArrived.mockRejectedValueOnce(new Error('server unavailable')).mockResolvedValueOnce({ status: 200 });
    const { renderer, navigation } = render();
    const endTrip = () => buttons(renderer).at(-1)!.props.onPress();

    await act(async () => { await endTrip(); await Promise.resolve(); });
    expect(mocks.alert).toHaveBeenCalledWith('Arrival failed', 'server unavailable');
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(JSON.stringify(renderer.toJSON())).toContain('Navigation');

    await act(async () => { await endTrip(); await Promise.resolve(); });
    expect(mocks.markArrived).toHaveBeenCalledTimes(2);
    expect(navigation.replace).toHaveBeenCalledOnce();
  });

  it('disables calling and never displays or initiates a fabricated phone number', async () => {
    const { renderer } = render({ latitude: 12.9716, longitude: 77.5946, plumberLatitude: 12.9616, plumberLongitude: 77.5846 });
    const callButton = buttons(renderer)[1];
    expect(callButton.props.disabled).toBe(true);
    expect(JSON.stringify(renderer.toJSON())).not.toContain('98765');
    expect(mocks.alert).not.toHaveBeenCalled();
    expect(callButton.props.onPress()).toBeUndefined();
    expect(mocks.alert).not.toHaveBeenCalled();
  });

  it('renders safe unavailable customer identity and no fabricated navigation values', async () => {
    const { renderer } = render({ latitude: 12.9716, longitude: 77.5946, plumberLatitude: 12.9616, plumberLongitude: 77.5846 });
    const output = JSON.stringify(renderer.toJSON());
    expect(output).toContain('Customer unavailable');
    expect(output).toContain('ETA unavailable');
    expect(output).toContain('Distance unavailable');
    for (const value of ['12 min', '4.3 km', '350 m', '100 Feet Road', 'Turn right']) {
      expect(output).not.toContain(value);
    }
    expect(output).not.toContain('98765');
  });

  it('shows unavailable map state when coordinates are missing', async () => {
    const { renderer } = render();
    expect(JSON.stringify(renderer.toJSON())).toContain('Map coordinates unavailable');
    expect(renderer.root.findAllByType('RouteMap' as any)).toHaveLength(0);
    expect(buttons(renderer)[0].props.disabled).toBe(true);
    buttons(renderer)[0].props.onPress();
    expect(mocks.alert).not.toHaveBeenCalledWith('Recenter', 'Map centered on live position.');
  });

  it('hides the turn-banner recenter affordance when turn data exists without map coordinates', () => {
    const { renderer } = render({ turnInstruction: 'Turn left', turnDistance: '180 m' });
    const output = JSON.stringify(renderer.toJSON());
    expect(output).toContain('Turn left');
    expect(renderer.root.findAllByType('RouteMap' as any)).toHaveLength(0);
    expect(renderer.root.findAllByType('LocationPinIcon' as any)).toHaveLength(0);
    expect(mocks.alert).not.toHaveBeenCalledWith('Recenter', 'Map centered on live position.');
  });

  it('renders exact backend/device navigation values without fallback replacement', async () => {
    mocks.activeJob.customer.fullName = 'Ravi Kumar';
    mocks.activeJob.customer.phone = '+919900001111';
    const { renderer } = render({
      latitude: 12.9716, longitude: 77.5946,
      plumberLatitude: 12.9616, plumberLongitude: 77.5846,
      routeEta: '8 min', routeDistance: '2.1 km',
      turnDistance: '180 m', turnInstruction: 'Turn left onto Main Road',
    });
    const output = JSON.stringify(renderer.toJSON());
    expect(output).toContain('Ravi Kumar');
    expect(output).toContain('8 min');
    expect(output).toContain('2.1 km');
    expect(output).toContain('180 m');
    expect(output).toContain('Turn left onto Main Road');
    buttons(renderer)[2].props.onPress();
    expect(mocks.alert).toHaveBeenCalledWith('Contact Customer', 'Calling customer at +919900001111');
    expect(renderer.root.findByType('RouteMap' as any).props).toMatchObject({
      plumberLatitude: 12.9616, plumberLongitude: 77.5846,
      customerLatitude: 12.9716, customerLongitude: 77.5946,
    });
  });
});

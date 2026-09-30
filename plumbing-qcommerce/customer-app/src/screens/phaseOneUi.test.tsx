import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  alert: vi.fn(),
  openURL: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/plumbers/plumberRepository', () => ({ PlumberRepository: { createServiceOrder: mocks.create } }));
vi.mock('../components/common/PrimaryButton', () => ({
  PrimaryButton: ({ title, onPress, loading }: any) => React.createElement('PrimaryButton', { title, onPress, loading }),
}));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator', SafeAreaView: 'SafeAreaView', ScrollView: 'ScrollView', View: 'View', Text: 'Text',
  TextInput: 'TextInput', TouchableOpacity: 'TouchableOpacity', Pressable: 'Pressable',
  Alert: { alert: mocks.alert }, Linking: { openURL: mocks.openURL }, Platform: { OS: 'ios' },
  StyleSheet: { create: (x: unknown) => x, flatten: (x: unknown) => x },
  Animated: { Value: function(this: any) { this.interpolate = () => ({}); }, spring: () => ({ start: vi.fn() }) },
}));
vi.mock('react-native-maps', () => ({ default: 'MapView', Marker: 'Marker', Polyline: 'Polyline' }));
vi.mock('../components/common/SecondaryButton', () => ({ SecondaryButton: () => null }));
vi.mock('../components/common/AppIcon', () => ({ AppIcon: () => null }));
vi.mock('../components/tracking/TrackingStatusStepper', () => ({ TrackingStatusStepper: () => null }));
vi.mock('../components/tracking/PulsingLocationMarker', () => ({ PulsingLocationMarker: () => null }));
vi.mock('../components/tracking/LiveTrackingCard', () => ({
  LiveTrackingCard: ({ name, eta, statusText, callDisabled, onCallPress }: any) => React.createElement('AssignmentCard', { name, eta, statusText, callDisabled, onCallPress }, [
    React.createElement('Text', { key: 'name' }, name),
    React.createElement('Text', { key: 'eta' }, eta),
  ]),
}));
vi.mock('../services/mockPolicy', () => ({ canUseDevMockFallbacks: () => false }));
vi.mock('../services/orders/orderRepository', () => ({ OrderRepository: { getCustomerMaterialRequests: vi.fn().mockResolvedValue([]) } }));
vi.mock('../services/cart/cartRepository', () => ({ CartRepository: { confirmPayment: vi.fn() } }));
vi.mock('../assets/icons/arrow-left.svg', () => ({ default: 'ArrowLeftIcon' }));

import { BookPlumberScreen } from './BookPlumberScreen';
import { PlumberConfirmationScreen } from './PlumberConfirmationScreen';
import { PlumberTrackingScreen } from './PlumberTrackingScreen';

const route = (scheduledFor: string | null = null) => ({ params: {
  issueType: 'Pipe Leakage', issueCategory: 'pipe', description: 'Leak', urgency: 'NORMAL', scheduledFor,
} } as any);

function texts(renderer: TestRenderer.ReactTestRenderer) { return JSON.stringify(renderer.toJSON()); }
function visibleText(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType('Text' as any)
    .map((node) => node.props.children)
    .flat(Infinity)
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
}
function touchableWithText(renderer: TestRenderer.ReactTestRenderer, label: string) {
  return renderer.root.findAllByType('TouchableOpacity' as any).find((node) =>
    String(node.findAllByType('Text' as any).map((text) => text.props.children).flat(Infinity).join(' ')).includes(label)
  );
}

describe('customer Phase 1 request UI', () => {
  it('keeps confirmation screen on 4xx and 5xx/network failures without fake success', async () => {
    const navigation = { replace: vi.fn(), goBack: vi.fn() };
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => { renderer = TestRenderer.create(<PlumberConfirmationScreen route={route()} navigation={navigation as any} />); });
    const inputs = renderer.root.findAllByType('TextInput' as any);
    inputs.forEach((input, i) => input.props.onChangeText(['Address', 'Mumbai', '400001', '+919876543210', '', ''][i]));
    for (const failure of [{ response: { status: 400, data: { error: 'Outside service area' } } }, new Error('network unavailable')]) {
      mocks.create.mockRejectedValueOnce(failure);
      const button = renderer.root.findAllByType('PrimaryButton' as any).find((item) => item.props.title === 'Confirm Booking')!;
      await act(async () => { await button.props.onPress(); });
      expect(navigation.replace).not.toHaveBeenCalled();
      expect(texts(renderer)).toContain('Confirm Booking');
      expect(texts(renderer)).not.toContain('PlumberTracking');
      expect(texts(renderer)).not.toContain('orderId":0');
      expect(texts(renderer)).not.toContain('fake');
      expect(mocks.alert).toHaveBeenCalled();
    }
  });

  it('passes Now as scheduledFor null and preserves a scheduled timestamp', async () => {
    const nowNavigation = { navigate: vi.fn(), goBack: vi.fn() };
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => { renderer = TestRenderer.create(<BookPlumberScreen navigation={nowNavigation as any} route={undefined as any} />); });
    const description = renderer.root.findAllByType('TextInput' as any)[0];
    await act(async () => { description.props.onChangeText('Leak'); });
    const continueButton = renderer.root.findAllByType('PrimaryButton' as any).find((item) => item.props.title === 'Continue')!;
    await act(async () => { continueButton.props.onPress(); });
    expect(nowNavigation.navigate).toHaveBeenCalledWith('PlumberConfirmation', expect.objectContaining({ scheduledFor: null }));

    const scheduleNavigation = { navigate: vi.fn(), goBack: vi.fn() };
    await act(async () => { renderer = TestRenderer.create(<BookPlumberScreen navigation={scheduleNavigation as any} route={undefined as any} />); });
    await act(async () => { renderer.root.findAllByType('TextInput' as any)[0].props.onChangeText('Leak'); });
    await act(async () => { touchableWithText(renderer, 'Schedule')?.props.onPress(); });
    const scheduleInput = renderer.root.findAllByType('TextInput' as any)[1];
    const scheduleContinue = renderer.root.findAllByType('PrimaryButton' as any).find((item) => item.props.title === 'Continue')!;
    await act(async () => { scheduleContinue.props.onPress(); });
    expect(scheduleNavigation.navigate).not.toHaveBeenCalled();
    await act(async () => { scheduleInput.props.onChangeText('2099-05-06T07:08'); });
    const button = renderer.root.findAllByType('PrimaryButton' as any).find((item) => item.props.title === 'Continue')!;
    await act(async () => { button.props.onPress(); });
    expect(scheduleNavigation.navigate).toHaveBeenCalledWith('PlumberConfirmation', expect.objectContaining({ scheduledFor: '2099-05-06T07:08:00' }));
  });

  it('blocks a strictly past scheduled timestamp without forwarding stale scheduling state', async () => {
    const navigation = { navigate: vi.fn(), goBack: vi.fn() };
    mocks.alert.mockReset();
    mocks.create.mockReset();
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => { renderer = TestRenderer.create(<BookPlumberScreen navigation={navigation as any} route={undefined as any} />); });
    await act(async () => { renderer.root.findAllByType('TextInput' as any)[0].props.onChangeText('Leak'); });
    await act(async () => { touchableWithText(renderer, 'Schedule')?.props.onPress(); });
    const scheduleInput = renderer.root.findAllByType('TextInput' as any)[1];
    await act(async () => { scheduleInput.props.onChangeText('2000-01-01T00:00'); });
    const continueButton = renderer.root.findAllByType('PrimaryButton' as any).find((item) => item.props.title === 'Continue')!;
    await act(async () => { continueButton.props.onPress(); });

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.alert).toHaveBeenCalledWith('Choose a future time', expect.any(String));
  });

  it('forwards only backend-provided assigned plumber identity and does not fabricate assignment details', async () => {
    const navigation = { replace: vi.fn(), goBack: vi.fn() };
    mocks.create.mockResolvedValueOnce({
      id: 321,
      plumberName: 'Asha Rao',
      plumberPhone: '+919900001111',
      customerLatitude: 19.076,
      customerLongitude: 72.8777,
      createdAt: '2026-09-30T14:20:00',
       assignedAt: null,
       estimatedArrivalAt: null,
       status: 'ACCEPTED',
     });
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => { renderer = TestRenderer.create(<PlumberConfirmationScreen route={route()} navigation={navigation as any} />); });
    const inputs = renderer.root.findAllByType('TextInput' as any);
    inputs.forEach((input, i) => input.props.onChangeText(['Address', 'Mumbai', '400001', '+919876543210', '', ''][i]));
    const confirm = renderer.root.findAllByType('PrimaryButton' as any).find((item) => item.props.title === 'Confirm Booking')!;
    await act(async () => { await confirm.props.onPress(); });

    expect(navigation.replace).toHaveBeenCalledWith('PlumberTracking', {
      orderId: 321,
       plumberId: null,
      plumberName: 'Asha Rao',
      plumberPhone: '+919900001111',
      customerLatitude: 19.076,
      customerLongitude: 72.8777,
      plumberLatitude: null,
      plumberLongitude: null,
      createdAt: '2026-09-30T14:20:00',
       assignedAt: null,
       estimatedArrivalAt: null,
       status: 'ACCEPTED',
     });
    let tracking!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tracking = TestRenderer.create(<PlumberTrackingScreen route={{ params: {
        orderId: 321, plumberId: '77', plumberName: 'Asha Rao', plumberPhone: '+919900001111',
        customerLatitude: 19.076, customerLongitude: 72.8777,
        plumberLatitude: null, plumberLongitude: null,
         createdAt: '2026-09-30T14:20:00', assignedAt: null, estimatedArrivalAt: null, status: 'ACCEPTED',
      } } as any} navigation={{} as any} />);
    });
    const assigned = tracking.root.findByType('AssignmentCard' as any);
    expect(assigned.props.name).toBe('Asha Rao');
    expect(assigned.props.eta).toBe('ETA unavailable');
    expect(visibleText(tracking)).toContain('Asha Rao');
    expect(visibleText(tracking)).not.toContain('4.8');
    expect(visibleText(tracking)).not.toContain('jobs');
    expect(visibleText(tracking)).not.toContain('Waiting for a plumber');
    expect(visibleText(tracking)).toContain('ETA unavailable');
    expect(tracking.root.findByType('AssignmentCard' as any).props.callDisabled).toBe(false);
    expect(visibleText(tracking)).not.toContain('09:30 AM');
    expect(visibleText(tracking)).not.toContain('Assigned plumber');

    let withEta!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      withEta = TestRenderer.create(<PlumberTrackingScreen route={{ params: { orderId: 321, plumberId: '77', plumberName: 'Asha Rao', plumberPhone: null, estimatedArrivalAt: '2026-09-30T15:30:00', createdAt: null, assignedAt: null, status: 'ACCEPTED' } } as any} navigation={{} as any} />);
    });
    expect(withEta.root.findByType('AssignmentCard' as any).props.eta).toBe('2026-09-30T15:30:00');
    expect(withEta.root.findByType('AssignmentCard' as any).props.callDisabled).toBe(true);
    expect(visibleText(withEta)).not.toContain('ETA unavailable');
  });

  it('renders waiting state for an unassigned pending backend response', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<PlumberTrackingScreen route={{ params: {
        orderId: 321, plumberId: null, plumberName: null, plumberPhone: null,
        customerLatitude: null, customerLongitude: null, plumberLatitude: null, plumberLongitude: null,
        estimatedArrivalAt: null, createdAt: null, assignedAt: null, status: 'PENDING',
      } } as any} navigation={{} as any} />);
    });
    const card = renderer.root.findByType('AssignmentCard' as any);
    expect(card.props.statusText).toBe('Waiting for a plumber');
    expect(card.props.name).toBe('Plumber unavailable');
    expect(card.props.callDisabled).toBe(true);
    expect(card.props.eta).toBe('ETA unavailable');
    expect(visibleText(renderer)).not.toContain('On the way to your location');
  });

  it.each([
    ['missing status', undefined, 'Waiting for a plumber'],
    ['pending', 'PENDING', 'Waiting for a plumber'],
    ['cancelled', 'CANCELLED', 'Booking cancelled'],
    ['completed', 'COMPLETED', 'Service completed'],
    ['customer confirmed', 'CUSTOMER_CONFIRMED', 'Service completed'],
    ['paid', 'PAID', 'Service completed'],
  ])('does not activate tracking for %s orders with a plumber name', (_label, status, expectedStatusText) => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => { renderer = TestRenderer.create(<PlumberTrackingScreen route={{ params: {
      orderId: 321, plumberId: null, plumberName: 'Asha Rao', plumberPhone: null,
      estimatedArrivalAt: null, createdAt: null, assignedAt: null, status,
    } } as any} navigation={{} as any} />); });
    const card = renderer.root.findByType('AssignmentCard' as any);
    expect(card.props.statusText).toBe(expectedStatusText);
    expect(card.props.statusText).not.toBe('On the way to your location');
  });

  it.each(['ACCEPTED', 'IN_PROGRESS'])('activates tracking for %s assigned orders', (status) => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => { renderer = TestRenderer.create(<PlumberTrackingScreen route={{ params: {
      orderId: 321, plumberId: null, plumberName: 'Asha Rao', plumberPhone: null,
      estimatedArrivalAt: null, createdAt: null, assignedAt: null, status,
    } } as any} navigation={{} as any} />); });
    const card = renderer.root.findByType('AssignmentCard' as any);
    expect(card.props.statusText).toBe('On the way to your location');
    expect(card.props.name).toBe('Asha Rao');
  });

  it('preserves a null plumber name through confirmation navigation', async () => {
    const navigation = { replace: vi.fn(), goBack: vi.fn() };
    mocks.create.mockResolvedValueOnce({
      id: 321, plumberName: null, plumberPhone: null, customerLatitude: null,
      customerLongitude: null, createdAt: null, assignedAt: null,
      estimatedArrivalAt: null, status: 'PENDING',
    });
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => { renderer = TestRenderer.create(<PlumberConfirmationScreen route={route()} navigation={navigation as any} />); });
    const confirm = renderer.root.findAllByType('PrimaryButton' as any).find((item) => item.props.title === 'Confirm Booking')!;
    await act(async () => { await confirm.props.onPress(); });
    expect(navigation.replace).toHaveBeenCalledWith('PlumberTracking', expect.objectContaining({ plumberName: null }));
    expect(navigation.replace).not.toHaveBeenCalledWith('PlumberTracking', expect.objectContaining({ plumberName: '' }));
  });

  it('renders maps only for real coordinates and shows unavailable state otherwise', async () => {
    const navigation = { replace: vi.fn(), goBack: vi.fn() };
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => { renderer = TestRenderer.create(<PlumberConfirmationScreen route={route()} navigation={navigation as any} />); });
    expect(texts(renderer)).toContain('Location unavailable');
    expect(renderer.root.findAllByType('MapView' as any)).toHaveLength(0);
    const coordinateInput = renderer.root.findAllByType('TextInput' as any)[5];
    await act(async () => { coordinateInput.props.onChangeText('19.0760,72.8777'); });
    expect(renderer.root.findAllByType('MapView' as any)).toHaveLength(1);
    const region = renderer.root.findByType('MapView' as any).props.initialRegion;
    expect(region.latitude).not.toBe(0); expect(region.longitude).not.toBe(0);
  });

  it('renders unassigned state without fabricated plumber identity, rating, jobs, or id', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => { renderer = TestRenderer.create(<PlumberConfirmationScreen route={route()} navigation={{} as any} />); });
    const output = visibleText(renderer);
    expect(output).toContain('Waiting for a plumber');
    expect(output).toContain('ETA unavailable');
    expect(output).not.toContain('jobs');
    expect(output).not.toContain('plumberId');
  });

  it('keeps tracking map and call unavailable without real assignment data, and uses exact real values when supplied', async () => {
    let missing!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      missing = TestRenderer.create(<PlumberTrackingScreen route={{ params: {
        orderId: 321, plumberId: '77', plumberName: 'Asha Rao', plumberPhone: null,
        customerLatitude: null, customerLongitude: null, plumberLatitude: null, plumberLongitude: null,
        createdAt: null, assignedAt: null, estimatedArrivalAt: null,
      } } as any} navigation={{} as any} />);
    });
    expect(visibleText(missing)).toContain('Map coordinates unavailable');
    expect(missing.root.findAllByType('MapView' as any)).toHaveLength(0);
    expect(missing.root.findByType('AssignmentCard' as any).props.callDisabled).toBe(true);
    expect(texts(missing)).not.toContain('17.4485');
    expect(texts(missing)).not.toContain('9876543210');

    let real!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      real = TestRenderer.create(<PlumberTrackingScreen route={{ params: {
        orderId: 321, plumberId: '77', plumberName: 'Asha Rao', plumberPhone: '+919900001111',
        customerLatitude: 19.076, customerLongitude: 72.8777, plumberLatitude: 19.08, plumberLongitude: 72.88,
        createdAt: '2026-09-30T14:20:00', assignedAt: null, estimatedArrivalAt: null,
      } } as any} navigation={{} as any} />);
    });
    expect(real.root.findByType('MapView' as any).props.initialRegion).toMatchObject({ latitude: 19.076, longitude: 72.8777 });
    expect(real.root.findAllByType('Marker' as any).map((node) => node.props.coordinate)).toEqual([
      { latitude: 19.076, longitude: 72.8777 }, { latitude: 19.08, longitude: 72.88 },
    ]);
    expect(real.root.findByType('AssignmentCard' as any).props.callDisabled).toBe(false);
    real.root.findByType('AssignmentCard' as any).props.onCallPress();
    expect(mocks.openURL).toHaveBeenCalledWith('tel:+919900001111');
  });
});

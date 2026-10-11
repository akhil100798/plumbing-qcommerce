import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  navigate: vi.fn(),
  fetchJobById: vi.fn(),
  startNavigation: vi.fn(),
  activeJob: null as any,
}));

vi.mock('../../services/jobs/jobService', () => ({ jobService: { fetchJobById: mocks.fetchJobById, startNavigation: mocks.startNavigation } }));
vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (selector: any) => selector({ job: { activeJob: mocks.activeJob } }),
}));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator', ScrollView: 'ScrollView', View: 'View', Text: 'Text',
  TouchableOpacity: 'TouchableOpacity', Alert: { alert: vi.fn() },
  StyleSheet: { create: (value: unknown) => value },
}));
vi.mock('../../components/common/ScreenWrapper', () => ({ ScreenWrapper: ({ children }: any) => children }));
vi.mock('../../components/common/AppHeader', () => ({ AppHeader: () => null }));
vi.mock('../../components/common/PrimaryButton', () => ({ PrimaryButton: ({ title, onPress, disabled }: any) => React.createElement('PrimaryButton', { title, onPress, disabled }) }));
vi.mock('../../components/common/JobProgressStepper', () => ({ JobProgressStepper: () => null }));
vi.mock('../../assets/icons/phone.svg', () => ({ default: 'PhoneIcon' }));
vi.mock('../../assets/icons/chat.svg', () => ({ default: 'ChatIcon' }));
vi.mock('../../assets/icons/location-pin.svg', () => ({ default: 'MapPinIcon' }));
vi.mock('../../assets/icons/navigation.svg', () => ({ default: 'NavigationIcon' }));

import { ActiveJobScreen } from './ActiveJobScreen';

const job = (coordinates: { latitude: number | null; longitude: number | null }) => ({
  jobId: 'job-42', status: 'accepted', address: 'Real address', issueDescription: 'Leak',
  customerNote: '', latitude: coordinates.latitude, longitude: coordinates.longitude,
  customer: { id: 'customer-7', fullName: 'Customer', phone: null, rating: null },
  timeline: {},
});

function render(activeJob: any) {
  mocks.activeJob = activeJob;
  const navigation = { navigate: mocks.navigate };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<ActiveJobScreen route={{ params: { jobId: 'job-42' } } as any} navigation={navigation as any} />);
  });
  return renderer;
}

describe('ActiveJobScreen navigation guards', () => {
  beforeEach(() => {
    mocks.dispatch.mockReset();
    mocks.navigate.mockReset();
    mocks.fetchJobById.mockReset();
    mocks.startNavigation.mockReset().mockResolvedValue(undefined);
  });

  it('does not advance or navigate when customer coordinates are missing', async () => {
    const renderer = render(job({ latitude: null, longitude: null }));
    const button = renderer.root.findByType('PrimaryButton' as any);
    await act(async () => { await button.props.onPress(); });

    expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({ status: 'on_the_way' }) }));
    expect(mocks.navigate).not.toHaveBeenCalledWith('Navigation', expect.anything());
    expect(renderer.root.findAllByType('Text' as any).map((node) => node.props.children).flat(Infinity)).toContain('ACCEPTED');
  });

  it('verifies the navigation action with the server before navigating when coordinates are real', async () => {
    const renderer = render(job({ latitude: 19.076, longitude: 72.8777 }));
    await act(async () => { await renderer.root.findByType('PrimaryButton' as any).props.onPress(); });

    expect(mocks.startNavigation).toHaveBeenCalledOnce();
    expect(mocks.startNavigation).toHaveBeenCalledWith('job-42');
    expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({ status: 'on_the_way' }) }));
    expect(mocks.navigate).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith('Navigation', expect.objectContaining({ jobId: 'job-42', latitude: 19.076, longitude: 72.8777 }));
  });
});

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  (globalThis as any).__DEV__ = true;
  return { reject: vi.fn(), alert: vi.fn(), dispatch: vi.fn() };
});
vi.mock('../../services/jobs/jobService', () => ({ jobService: { rejectJob: mocks.reject, acceptJob: vi.fn() } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(), setItemAsync: vi.fn(), deleteItemAsync: vi.fn(),
}));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert }, View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity', StyleSheet: { create: (x: unknown) => x },
}));
vi.mock('../../components/common/ScreenWrapper', () => ({ ScreenWrapper: ({ children }: any) => children }));
vi.mock('../../assets/icons/location-pin.svg', () => ({ default: 'MapPinIcon' }));
vi.mock('../../assets/icons/star.svg', () => ({ default: 'StarIcon' }));
vi.mock('../../assets/icons/active-job.svg', () => ({ default: 'WrenchIcon' }));

import { IncomingJobRequestScreen } from './IncomingJobRequestScreen';

function render() {
  const navigation = { goBack: vi.fn(), replace: vi.fn() };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(<IncomingJobRequestScreen route={{ params: { jobId: '42', customerId: '7', distance: null } } as any} navigation={navigation as any} />); });
  return { renderer, navigation };
}

describe('IncomingJobRequestScreen decline behavior', () => {
  it.each([
    ['success', undefined],
    ['conflict', { response: { status: 409 } }],
    ['authorization', { response: { status: 403 } }],
    ['network', { response: { status: 503 } }],
  ])('does not remove the offer before backend %s result', async (_label, failure) => {
    mocks.dispatch.mockReset();
    mocks.alert.mockReset();
    const { renderer, navigation } = render();
    mocks.reject.mockReset();
    if (failure) mocks.reject.mockRejectedValue(failure); else mocks.reject.mockResolvedValue(undefined);
    const rejectButton = renderer.root.findAllByType('TouchableOpacity' as any)[0];
    await act(async () => { await rejectButton.props.onPress(); });
    expect(mocks.reject).toHaveBeenCalledWith('42');
    if (failure) {
      expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringContaining('removeIncomingJob') }));
      expect(navigation.goBack).not.toHaveBeenCalled();
      expect(mocks.alert).toHaveBeenCalled();
      expect(JSON.stringify(renderer.toJSON())).toContain('New Job Request');
    } else {
      expect(mocks.dispatch).toHaveBeenCalled();
      expect(navigation.goBack).toHaveBeenCalled();
    }
  });
});

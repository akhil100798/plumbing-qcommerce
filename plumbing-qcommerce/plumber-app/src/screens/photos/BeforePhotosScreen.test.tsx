import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

const photoMocks = vi.hoisted(() => ({
  list: vi.fn(),
  pickAndUpload: vi.fn(),
}));

const alertMock = vi.hoisted(() => vi.fn());

vi.mock('react-native', () => ({
  Alert: { alert: alertMock },
  SafeAreaView: 'safe-area-view',
  ScrollView: 'scroll-view',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'text',
  View: 'view',
}));

vi.mock('../../components/common/AppHeader', () => ({
  AppHeader: () => React.createElement('header'),
}));

vi.mock('../../components/common/PhotoGrid', () => ({
  PhotoGrid: (props: any) => React.createElement('photo-grid', { ...props, testID: 'photo-grid' }),
}));

vi.mock('../../components/common/PrimaryButton', () => ({
  PrimaryButton: (props: any) => React.createElement('primary-button', { ...props, testID: 'after-photos' }),
}));

vi.mock('../../components/common/SecondaryButton', () => ({
  SecondaryButton: (props: any) => React.createElement('secondary-button', { ...props, testID: 'request-parts' }),
}));

vi.mock('../../services/photos/photoService', () => ({
  photoService: photoMocks,
}));

import { BeforePhotosScreen } from './BeforePhotosScreen';

describe('BeforePhotosScreen', () => {
  it('loads persisted BEFORE photos, uploads through the real service, and enables material requests at three photos', async () => {
    photoMocks.list.mockResolvedValue([]);
    photoMocks.pickAndUpload.mockImplementation(async (_jobId: string, _phase: string) => ({
      id: photoMocks.pickAndUpload.mock.calls.length,
      uri: 'data:image/png;base64,photo-' + photoMocks.pickAndUpload.mock.calls.length,
      contentType: 'image/png',
      sizeBytes: 128,
    }));

    const navigation = { navigate: vi.fn(), goBack: vi.fn() };
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BeforePhotosScreen
          route={{ params: { jobId: '18' } } as any}
          navigation={navigation as any}
        />
      );
    });

    expect(photoMocks.list).toHaveBeenCalledWith('18', 'BEFORE');
    expect(renderer.root.findByProps({ testID: 'request-parts' }).props.disabled).toBe(true);

    for (let i = 0; i < 3; i += 1) {
      const grid = renderer.root.findByProps({ testID: 'photo-grid' });
      await act(async () => {
        await grid.props.onAddPhoto();
      });
    }

    expect(photoMocks.pickAndUpload).toHaveBeenCalledTimes(3);
    expect(photoMocks.pickAndUpload).toHaveBeenCalledWith('18', 'BEFORE');
    expect(renderer.root.findByProps({ testID: 'photo-grid' }).props.photos).toHaveLength(3);
    expect(renderer.root.findByProps({ testID: 'request-parts' }).props.disabled).toBe(false);

    await act(async () => {
      renderer.root.findByProps({ testID: 'request-parts' }).props.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('StoreSelection', { jobId: '18' });
  });

  it('does not satisfy the prerequisite when the picker is cancelled', async () => {
    photoMocks.list.mockResolvedValue([]);
    photoMocks.pickAndUpload.mockResolvedValue(null);

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BeforePhotosScreen
          route={{ params: { jobId: '18' } } as any}
          navigation={{ navigate: vi.fn(), goBack: vi.fn() } as any}
        />
      );
    });

    const grid = renderer.root.findByProps({ testID: 'photo-grid' });
    await act(async () => {
      await grid.props.onAddPhoto();
    });

    expect(renderer.root.findByProps({ testID: 'photo-grid' }).props.photos).toHaveLength(0);
    expect(renderer.root.findByProps({ testID: 'request-parts' }).props.disabled).toBe(true);
    expect(alertMock).not.toHaveBeenCalled();
  });
});

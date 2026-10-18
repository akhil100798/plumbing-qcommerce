import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  submitServiceRating: vi.fn(),
  getServiceRating: vi.fn(),
  confirmServiceOrder: vi.fn(),
  alert: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../services/orders/orderRepository', () => ({
  OrderRepository: {
    submitServiceRating: mocks.submitServiceRating,
    getServiceRating: mocks.getServiceRating,
    confirmServiceOrder: mocks.confirmServiceOrder,
  },
}));

vi.mock('../components/common/PrimaryButton', () => ({
  PrimaryButton: ({ title, onPress, loading, disabled }: any) =>
    React.createElement('PrimaryButton', { title, onPress, loading, disabled }),
}));

vi.mock('../components/cards/RatingCard', () => ({
  RatingCard: ({ rating, onRatingChange, selectedTip, onTipChange }: any) =>
    React.createElement('RatingCard', { rating, onRatingChange, selectedTip, onTipChange }),
}));

vi.mock('react-native', () => ({
  Alert: {
    alert: mocks.alert,
  },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'android' },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: ({ value, onChangeText, placeholder, ...rest }: any) =>
    React.createElement('TextInput', { value, onChangeText, placeholder, ...rest }),
  View: 'View',
}));

import { ServiceCompletionScreen } from './ServiceCompletionScreen';

describe('ServiceCompletionScreen', () => {
  const defaultNavigation = {
    navigate: mocks.navigate,
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServiceRating.mockRejectedValue(new Error('No existing rating'));
  });

  it('renders initial state with plumber name and active submit button', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(ServiceCompletionScreen, {
          route: { params: { orderId: 42, plumberName: 'Ramesh Plumber' } } as any,
          navigation: defaultNavigation,
        })
      );
    });

    const root = renderer.root;
    const button = root.findByType('PrimaryButton' as any);
    expect(button.props.title).toBe('Submit & Finish');

    const textNodes = root.findAllByType('Text' as any);
    const allText = textNodes.map((n) => n.props.children).join(' ');
    expect(allText).toContain('Ramesh Plumber');
    expect(allText).toContain('Service Completed!');
  });

  it('submits rating and comment through OrderRepository when user clicks Submit & Finish', async () => {
    mocks.submitServiceRating.mockResolvedValueOnce({
      orderId: 42,
      rating: 5,
      comment: 'Great job!',
      ratedAt: '2026-10-18T10:00:00',
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(ServiceCompletionScreen, {
          route: { params: { orderId: 42, plumberName: 'Ramesh Plumber' } } as any,
          navigation: defaultNavigation,
        })
      );
    });

    const root = renderer.root;
    const button = root.findByType('PrimaryButton' as any);

    await act(async () => {
      await button.props.onPress();
    });

    expect(mocks.submitServiceRating).toHaveBeenCalledWith(42, 5, '');
    expect(mocks.alert).toHaveBeenCalledWith(
      'Thank You!',
      'Your service completion and feedback have been successfully submitted.',
      expect.any(Array)
    );
  });

  it('handles 409 conflict gracefully when order has already been rated', async () => {
    const error409 = {
      response: {
        status: 409,
        data: { message: 'Rating has already been submitted for order #42' },
      },
    };
    mocks.submitServiceRating.mockRejectedValueOnce(error409);

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(ServiceCompletionScreen, {
          route: { params: { orderId: 42, plumberName: 'Ramesh Plumber' } } as any,
          navigation: defaultNavigation,
        })
      );
    });

    const root = renderer.root;
    const button = root.findByType('PrimaryButton' as any);

    await act(async () => {
      await button.props.onPress();
    });

    expect(mocks.alert).toHaveBeenCalledWith(
      'Already Submitted',
      'This service order has already been rated and confirmed.',
      expect.any(Array)
    );
  });

  it('pre-populates existing rating when getServiceRating returns an existing record', async () => {
    mocks.getServiceRating.mockResolvedValueOnce({
      orderId: 42,
      rating: 4,
      comment: 'Satisfactory work',
      ratedAt: '2026-10-17T12:00:00',
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(ServiceCompletionScreen, {
          route: { params: { orderId: 42, plumberName: 'Ramesh Plumber' } } as any,
          navigation: defaultNavigation,
        })
      );
    });

    const root = renderer.root;
    const button = root.findByType('PrimaryButton' as any);
    expect(button.props.title).toBe('Done');

    const textNodes = root.findAllByType('Text' as any);
    const allText = textNodes.map((n) => n.props.children).join(' ');
    expect(allText).toContain('Service Confirmed');
  });

  it('prevents submission if orderId is missing', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(ServiceCompletionScreen, {
          route: { params: { orderId: 0, plumberName: 'Ramesh Plumber' } } as any,
          navigation: defaultNavigation,
        })
      );
    });

    const root = renderer.root;
    const button = root.findByType('PrimaryButton' as any);

    await act(async () => {
      await button.props.onPress();
    });

    expect(mocks.submitServiceRating).not.toHaveBeenCalled();
    expect(mocks.alert).toHaveBeenCalledWith('Error', 'Missing valid service order identifier.');
  });
});

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDiagnosis: vi.fn(),
  getEvidence: vi.fn(),
  getCurrentQuote: vi.fn(),
  getEvidenceImageSource: vi.fn(),
  approveQuote: vi.fn(),
  rejectQuote: vi.fn(),
}));

vi.mock('../services/orders/phase2OrderRepository', () => ({
  Phase2OrderRepository: {
    getDiagnosis: mocks.getDiagnosis,
    getEvidence: mocks.getEvidence,
    getCurrentQuote: mocks.getCurrentQuote,
    getEvidenceImageSource: mocks.getEvidenceImageSource,
    approveQuote: mocks.approveQuote,
    rejectQuote: mocks.rejectQuote,
  },
}));

vi.mock('../components/common/PrimaryButton', () => ({
  PrimaryButton: ({ title, onPress, loading }: any) => React.createElement('PrimaryButton', { title, onPress, loading }),
}));

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));

import { ServiceDiagnosisScreen } from './ServiceDiagnosisScreen';

const quote = {
  id: 8,
  kind: 'INITIAL',
  state: 'PUBLISHED',
  version: 1,
  currency: 'INR',
  laborSubtotal: 500,
  knownMaterialSubtotal: 0,
  total: 500,
  publishedAt: '2026-10-05T10:00:00',
  expiresAt: null,
  lines: [{ lineType: 'LABOR', description: 'Repair', quantity: 1, unit: 'job', unitPrice: 500, lineTotal: 500 }],
};
const approvedQuote = { ...quote, state: 'APPROVED' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function visibleText(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType('Text' as any)
    .map((node) => node.props.children)
    .flat(Infinity)
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('customer diagnosis quote decisions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getDiagnosis.mockResolvedValue({ state: 'SUBMITTED', affectedComponent: 'Pipe', observedCondition: 'Leak', diagnosisNarrative: 'Seal failed', recommendedRemedy: 'Replace seal', safetyNotes: null });
    mocks.getEvidence.mockResolvedValue([]);
    mocks.getCurrentQuote.mockResolvedValue(quote);
    mocks.getEvidenceImageSource.mockResolvedValue({ uri: 'https://example.invalid/evidence', headers: { Authorization: 'Bearer test' } });
  });

  it('keeps the failed decision visible after a successful refresh and does not show a false approval', async () => {
    const decisionError = new Error('Approval was not confirmed by the server');
    mocks.approveQuote.mockRejectedValueOnce(decisionError);
    const navigation = { addListener: vi.fn(() => vi.fn()) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });

    const approve = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Approve labor quote')!;
    await act(async () => { await approve.props.onPress(); });

    expect(mocks.approveQuote).toHaveBeenCalledWith(42, 8, 'customer-42-quote-8-approve-1');
    expect(mocks.getCurrentQuote).toHaveBeenCalledTimes(2);
    expect(visibleText(renderer)).toContain(decisionError.message);
    expect(visibleText(renderer)).toContain('Labor quote');
    expect(visibleText(renderer)).toContain('PUBLISHED');
    expect(visibleText(renderer)).not.toContain('Approved. Your plumber can proceed with the quoted repair.');
    const retryButton = renderer.root.findAllByType('PrimaryButton' as any).find((button) => button.props.title === 'Approve labor quote');
    expect(retryButton).toBeDefined();
    expect(retryButton!.props.loading).toBe(false);
  });

  it('keeps a rejected decline visible after refresh without showing a false rejection', async () => {
    const decisionError = new Error('Decline was not confirmed by the server');
    mocks.rejectQuote.mockRejectedValueOnce(decisionError);
    const navigation = { addListener: vi.fn(() => vi.fn()) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });

    const decline = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Decline quote')!;
    await act(async () => { await decline.props.onPress(); });

    expect(mocks.rejectQuote).toHaveBeenCalledWith(42, 8, 'Customer declined this quote', 'customer-42-quote-8-reject-1');
    expect(mocks.getCurrentQuote).toHaveBeenCalledTimes(2);
    expect(visibleText(renderer)).toContain(decisionError.message);
    expect(visibleText(renderer)).toContain('Labor quote');
    expect(visibleText(renderer)).toContain('PUBLISHED');
    expect(visibleText(renderer)).not.toContain('Declined. Your plumber may send a supported revised quote.');
    const retryButton = renderer.root.findAllByType('PrimaryButton' as any).find((button) => button.props.title === 'Decline quote');
    expect(retryButton).toBeDefined();
    expect(retryButton!.props.loading).toBe(false);
  });

  it('shows the fallback when a decision throws a non-Error value, even after refresh', async () => {
    mocks.approveQuote.mockRejectedValueOnce('unstructured failure');
    const navigation = { addListener: vi.fn(() => vi.fn()) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });

    const approve = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Approve labor quote')!;
    await act(async () => { await approve.props.onPress(); });

    expect(visibleText(renderer)).toContain('Your decision was not confirmed. Refresh before retrying.');
    expect(visibleText(renderer)).toContain('Labor quote');
    expect(visibleText(renderer)).toContain('PUBLISHED');
    expect(visibleText(renderer)).not.toContain('Approved. Your plumber can proceed with the quoted repair.');
  });

  it('keeps the newest refresh result when an older request resolves later', async () => {
    const olderQuoteRequest = deferred<typeof quote>();
    const newerQuoteRequest = deferred<typeof approvedQuote>();
    const focusListeners: Array<() => void> = [];
    const navigation = { addListener: vi.fn((_event: string, listener: () => void) => { focusListeners.push(listener); return vi.fn(); }) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });

    mocks.getCurrentQuote
      .mockImplementationOnce(() => olderQuoteRequest.promise)
      .mockImplementationOnce(() => newerQuoteRequest.promise);
    await act(async () => { focusListeners[0](); });
    const refreshButton = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Refreshing…')!;
    await act(async () => { await refreshButton.props.onPress(); });

    await act(async () => {
      newerQuoteRequest.resolve(approvedQuote);
      await newerQuoteRequest.promise;
    });
    await act(async () => {
      olderQuoteRequest.resolve(quote);
      await olderQuoteRequest.promise;
    });

    expect(visibleText(renderer)).toContain('APPROVED');
    expect(visibleText(renderer)).not.toContain('PUBLISHED');
  });

  it('preserves the last-known diagnosis and quote when recovery refresh also fails', async () => {
    mocks.approveQuote.mockRejectedValueOnce(new Error('Approval outcome unknown'));
    const navigation = { addListener: vi.fn(() => vi.fn()) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });

    mocks.getDiagnosis.mockRejectedValueOnce(new Error('Diagnosis service unavailable'));
    mocks.getEvidence.mockRejectedValueOnce(new Error('Evidence service unavailable'));
    mocks.getCurrentQuote.mockRejectedValueOnce(new Error('Quote service unavailable'));
    const approve = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Approve labor quote')!;
    await act(async () => { await approve.props.onPress(); });

    const text = visibleText(renderer);
    expect(text).toContain('Approval outcome unknown');
    expect(text).toContain('Latest status could not be confirmed');
    expect(text).toContain('Seal failed');
    expect(text).toContain('PUBLISHED');
    expect(text).not.toContain('Your plumber has not submitted the diagnosis yet.');
    expect(text).not.toContain('Approved. Your plumber can proceed with the quoted repair.');
  });

  it('applies a confirmed quote decision even when an evidence image lookup fails', async () => {
    mocks.approveQuote.mockRejectedValueOnce(new Error('Approval response was lost'));
    mocks.getEvidence.mockResolvedValue([{ id: 1, photoId: 17, phase: 'DIAGNOSIS', contentType: 'image/jpeg', sizeBytes: 10, createdAt: '2026-10-05T10:00:00' }]);
    mocks.getCurrentQuote.mockResolvedValueOnce(quote).mockResolvedValueOnce(approvedQuote);
    mocks.getEvidenceImageSource.mockResolvedValueOnce({ uri: 'https://example.invalid/first', headers: { Authorization: 'Bearer test' } })
      .mockRejectedValueOnce(new Error('Evidence image temporarily unavailable'));
    const navigation = { addListener: vi.fn(() => vi.fn()) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });
    const approve = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Approve labor quote')!;
    await act(async () => { await approve.props.onPress(); });

    expect(visibleText(renderer)).toContain('APPROVED');
    expect(visibleText(renderer)).toContain('Approved. Your plumber can proceed with the quoted repair.');
    expect(visibleText(renderer)).toContain('Approval response was lost');
    expect(visibleText(renderer)).toContain('Some diagnostic evidence could not be loaded.');
    expect(visibleText(renderer)).not.toContain('Latest status could not be confirmed');
  });

  it('preserves the quote and warns when an error mentions current quote without HTTP 404', async () => {
    mocks.approveQuote.mockRejectedValueOnce(new Error('Approval outcome unknown'));
    mocks.getCurrentQuote.mockResolvedValueOnce(quote).mockRejectedValueOnce(new Error('Could not fetch current quote: network unavailable'));
    const navigation = { addListener: vi.fn(() => vi.fn()) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });
    const approve = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Approve labor quote')!;
    await act(async () => { await approve.props.onPress(); });

    expect(visibleText(renderer)).toContain('PUBLISHED');
    expect(visibleText(renderer)).toContain('Could not fetch current quote: network unavailable');
    expect(visibleText(renderer)).toContain('Latest status could not be confirmed: Could not fetch current quote: network unavailable');
  });

  it('clears the last-known quote only when the current-quote endpoint returns HTTP 404', async () => {
    mocks.approveQuote.mockRejectedValueOnce(new Error('Approval outcome unknown'));
    mocks.getCurrentQuote.mockResolvedValueOnce(quote)
      .mockRejectedValueOnce(Object.assign(new Error('Current quote not found'), { status: 404 }));
    const navigation = { addListener: vi.fn(() => vi.fn()) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });
    const approve = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Approve labor quote')!;
    await act(async () => { await approve.props.onPress(); });

    expect(visibleText(renderer)).toContain('Approval outcome unknown');
    expect(visibleText(renderer)).not.toContain('PUBLISHED');
    expect(visibleText(renderer)).not.toContain('Latest status could not be confirmed');
  });

  it('does not let an old decision recovery overwrite a newer refresh error', async () => {
    const oldRecoveryQuote = deferred<typeof approvedQuote>();
    const focusListeners: Array<() => void> = [];
    const navigation = { addListener: vi.fn((_event: string, listener: () => void) => { focusListeners.push(listener); return vi.fn(); }) };
    mocks.approveQuote.mockRejectedValueOnce(new Error('Old decision response lost'));
    mocks.getCurrentQuote.mockImplementationOnce(() => Promise.resolve(quote))
      .mockImplementationOnce(() => oldRecoveryQuote.promise)
      .mockRejectedValueOnce(new Error('Newer refresh could not confirm quote status'));
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });
    const approve = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Approve labor quote')!;
    let pendingDecision!: Promise<void>;
    await act(async () => { pendingDecision = approve.props.onPress(); await Promise.resolve(); });
    await act(async () => { focusListeners[0](); await Promise.resolve(); });
    await act(async () => { await pendingDecision; });

    expect(visibleText(renderer)).toContain('Newer refresh could not confirm quote status');
    await act(async () => {
      oldRecoveryQuote.resolve(approvedQuote);
      await oldRecoveryQuote.promise;
    });
    expect(visibleText(renderer)).toContain('PUBLISHED');
    expect(visibleText(renderer)).toContain('Old decision response lost');
    expect(visibleText(renderer)).toContain('Latest status could not be confirmed: Newer refresh could not confirm quote status');
    expect(visibleText(renderer)).not.toContain('APPROVED');
  });

  it('ignores a pending prior-order decision after route params switch to another order', async () => {
    const pendingApproval = deferred<typeof quote>();
    mocks.approveQuote.mockImplementationOnce(() => pendingApproval.promise);
    mocks.getCurrentQuote.mockResolvedValueOnce(quote).mockResolvedValueOnce(approvedQuote);
    const navigation = { addListener: vi.fn(() => vi.fn()) };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 42, plumberName: 'Asha' } } as any}
          navigation={navigation as any}
        />,
      );
    });
    const approve = renderer.root.findAllByType('PrimaryButton' as any)
      .find((button) => button.props.title === 'Approve labor quote')!;
    let pendingDecision!: Promise<void>;
    await act(async () => { pendingDecision = approve.props.onPress(); await Promise.resolve(); });
    await act(async () => {
      renderer.update(
        <ServiceDiagnosisScreen
          route={{ params: { orderId: 99, plumberName: 'Beena' } } as any}
          navigation={navigation as any}
        />,
      );
    });
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await pendingDecision; });

    expect(mocks.getCurrentQuote).toHaveBeenCalledTimes(2);
    expect(mocks.getCurrentQuote).toHaveBeenLastCalledWith(99);
    expect(visibleText(renderer)).toContain('APPROVED');
    await act(async () => {
      pendingApproval.resolve(quote);
      await pendingApproval.promise;
      await pendingDecision;
    });
    expect(visibleText(renderer)).toContain('APPROVED');
    expect(visibleText(renderer)).not.toContain('PUBLISHED');
  });
});

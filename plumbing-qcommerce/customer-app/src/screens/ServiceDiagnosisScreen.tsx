import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { Phase2OrderRepository } from '../services/orders/phase2OrderRepository';
import { CustomerDiagnosisDTO, CustomerQuoteDTO, DiagnosisEvidenceDTO } from '../services/orders/phase2Types';
import { AppStackParamList } from '../types/navigation';
import { colors, spacing, typography, borderRadius } from '../theme';

type Props = StackScreenProps<AppStackParamList, 'ServiceDiagnosis'>;

export function ServiceDiagnosisScreen({ route, navigation }: Props) {
  const { orderId, plumberName } = route.params;
  const [diagnosis, setDiagnosis] = useState<CustomerDiagnosisDTO | null>(null);
  const [evidence, setEvidence] = useState<DiagnosisEvidenceDTO[]>([]);
  const [quote, setQuote] = useState<CustomerQuoteDTO | null>(null);
  const [imageSources, setImageSources] = useState<Record<number, { uri: string; headers: { Authorization: string } }>>({});
  const [loading, setLoading] = useState(true);
  const [displayOrderId, setDisplayOrderId] = useState(orderId);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [quoteStatusConfirmed, setQuoteStatusConfirmed] = useState<boolean | null>(null);
  const refreshSequence = useRef(0);
  const evidenceSnapshot = useRef(evidence);
  const routeOrderId = useRef(orderId);
  const routeEpoch = useRef(0);
  const snapshotOrderId = useRef(orderId);

  useLayoutEffect(() => {
    routeOrderId.current = orderId;
    routeEpoch.current += 1;
    setDisplayOrderId(orderId);
    refreshSequence.current += 1;
    snapshotOrderId.current = orderId;
    evidenceSnapshot.current = [];
    setDiagnosis(null);
    setEvidence([]);
    setQuote(null);
    setImageSources({});
    setActing(false);
    setError(null);
    setDecisionError(null);
    setQuoteStatusConfirmed(null);
    setLoading(true);
    setRefreshing(false);
  }, [orderId]);

  const refresh = useCallback(async (showSpinner = true) => {
    const requestedOrderId = orderId;
    const sequence = ++refreshSequence.current;
    const stale = () => ({ error: null, statusConfirmed: false, current: false, sequence });
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [diagnosisResult, evidenceResult, quoteResult] = await Promise.allSettled([
        Phase2OrderRepository.getDiagnosis(requestedOrderId),
        Phase2OrderRepository.getEvidence(requestedOrderId),
        Phase2OrderRepository.getCurrentQuote(requestedOrderId),
      ]);
      if (sequence !== refreshSequence.current || requestedOrderId !== routeOrderId.current) return stale();

      if (snapshotOrderId.current !== requestedOrderId) {
        snapshotOrderId.current = requestedOrderId;
        evidenceSnapshot.current = [];
      }
      const nextEvidence = evidenceResult.status === 'fulfilled' ? evidenceResult.value : evidenceSnapshot.current;
      const sources = await Promise.all(nextEvidence.map(async (item) => {
        try {
          return [item.photoId, await Phase2OrderRepository.getEvidenceImageSource(requestedOrderId, item.photoId)] as const;
        } catch {
          return null;
        }
      }));
      if (sequence !== refreshSequence.current || requestedOrderId !== routeOrderId.current) return stale();

      const diagnosisNotFound = diagnosisResult.status === 'rejected' &&
        (diagnosisResult.reason as { status?: number } | null)?.status === 404;
      const quoteNotFound = quoteResult.status === 'rejected' &&
        (quoteResult.reason as { status?: number } | null)?.status === 404;

      if (diagnosisResult.status === 'fulfilled') {
        setDiagnosis(diagnosisResult.value.state === 'SUBMITTED' ? diagnosisResult.value : null);
      } else if (diagnosisNotFound) {
        setDiagnosis(null);
      }
      if (evidenceResult.status === 'fulfilled') {
        evidenceSnapshot.current = nextEvidence;
        setEvidence(nextEvidence);
      }
      if (quoteResult.status === 'fulfilled') setQuote(quoteResult.value);
      else if (quoteNotFound) setQuote(null);
      if (quoteResult.status === 'fulfilled' || quoteNotFound) setQuoteStatusConfirmed(true);
      else setQuoteStatusConfirmed(false);
      setImageSources(Object.fromEntries(sources.filter((source): source is NonNullable<typeof source> => source !== null)));
      const results = [diagnosisResult, evidenceResult, quoteResult];
      const failures = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected' && (result.reason as { status?: number } | null)?.status !== 404)
        .map((result) => result.reason instanceof Error ? result.reason.message : 'A service update is temporarily unavailable.');
      const imageFailed = sources.some((source) => source === null);
      const refreshError = failures[0] ?? (diagnosisResult.status === 'rejected' && !diagnosisNotFound ? 'Diagnosis is not available yet. Refresh after your plumber submits it.' : null)
        ?? (imageFailed ? 'Some diagnostic evidence could not be loaded.' : null);
      if (refreshError) setError(refreshError);
      return { error: refreshError, statusConfirmed: quoteResult.status === 'fulfilled' || quoteNotFound, current: true, sequence };
    } catch (cause) {
      const refreshError = cause instanceof Error ? cause.message : 'Could not load the diagnosis and quote.';
      if (sequence !== refreshSequence.current || requestedOrderId !== routeOrderId.current) return stale();
      setError(refreshError);
      return { error: refreshError, statusConfirmed: false, current: true, sequence };
    } finally {
      if (sequence === refreshSequence.current && requestedOrderId === routeOrderId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { void refresh(false); });
    void refresh();
    return unsubscribe;
  }, [navigation, refresh]);

  const decide = async (action: 'approve' | 'reject') => {
    if (!quote || quote.state !== 'PUBLISHED') return;
    const requestedOrderId = orderId;
    const requestedRouteEpoch = routeEpoch.current;
    refreshSequence.current += 1;
    setRefreshing(false);
    setActing(true);
    setError(null);
    setDecisionError(null);
    const key = `customer-${requestedOrderId}-quote-${quote.id}-${action}-${quote.version}`;
    try {
      const updated = action === 'approve'
        ? await Phase2OrderRepository.approveQuote(requestedOrderId, quote.id, key)
        : await Phase2OrderRepository.rejectQuote(requestedOrderId, quote.id, 'Customer declined this quote', key);
      if (requestedOrderId !== routeOrderId.current || requestedRouteEpoch !== routeEpoch.current) return;
      refreshSequence.current += 1;
      setRefreshing(false);
      setQuote(updated);
    } catch (cause) {
      if (requestedOrderId !== routeOrderId.current || requestedRouteEpoch !== routeEpoch.current) return;
      const message = cause instanceof Error ? cause.message : 'Your decision was not confirmed. Refresh before retrying.';
      setDecisionError(message);
      await refresh(false);
    } finally {
      if (requestedOrderId === routeOrderId.current && requestedRouteEpoch === routeEpoch.current) setActing(false);
    }
  };

  const currencyAmount = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

  if (loading || displayOrderId !== orderId) return <SafeAreaView style={styles.container}><ActivityIndicator color={colors.primary} /><Text style={styles.message}>Loading diagnosis…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Diagnosis & quote</Text>
        <Text style={styles.subtitle}>Service request #{orderId}{plumberName ? ` · ${plumberName}` : ''}</Text>
        {decisionError ? <View style={styles.errorCard}><Text style={styles.errorText}>{decisionError}</Text></View> : null}
        {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{decisionError && quoteStatusConfirmed === false ? `Latest status could not be confirmed: ${error}` : error}</Text></View> : null}
        <PrimaryButton title={refreshing ? 'Refreshing…' : 'Refresh latest update'} onPress={() => void refresh(false)} loading={refreshing} />

        {!diagnosis ? <View style={styles.card}><Text style={styles.body}>Your plumber has not submitted the diagnosis yet. You can return later or refresh for an update.</Text></View> : null}
        {diagnosis ? <View style={styles.card}>
          <Text style={styles.sectionTitle}>{diagnosis.affectedComponent}</Text>
          <Text style={styles.label}>What we found</Text><Text style={styles.body}>{diagnosis.observedCondition}</Text>
          <Text style={styles.label}>Diagnosis</Text><Text style={styles.body}>{diagnosis.diagnosisNarrative}</Text>
          <Text style={styles.label}>Recommended repair</Text><Text style={styles.body}>{diagnosis.recommendedRemedy}</Text>
          {diagnosis.safetyNotes ? <><Text style={styles.label}>Safety notes</Text><Text style={styles.body}>{diagnosis.safetyNotes}</Text></> : null}
          {diagnosis.safetyNotes && diagnosis.state !== 'SUBMITTED' ? <Text style={styles.errorText}>Ask your plumber before proceeding.</Text> : null}
          <Text style={styles.label}>Diagnostic evidence</Text>
          {evidence.map((item) => imageSources[item.photoId] ? <Image key={item.photoId} source={imageSources[item.photoId]} style={styles.evidence} resizeMode="cover" /> : null)}
          {evidence.length === 0 ? <Text style={styles.body}>No evidence is available.</Text> : null}
        </View> : null}

        {quote ? <View style={styles.card}>
          <Text style={styles.sectionTitle}>Labor quote · {quote.state}</Text>
          <Text style={styles.body}>Quote version {quote.version}{quote.expiresAt ? ` · Expires ${new Date(quote.expiresAt).toLocaleString()}` : ''}</Text>
          {quote.lines.map((line, index) => <View key={`${line.description}-${index}`} style={styles.line}>
            <Text style={styles.body}>{line.description} · {line.quantity} {line.unit}</Text>
            <Text style={styles.body}>{currencyAmount(line.lineTotal, quote.currency)}</Text>
          </View>)}
          <View style={styles.totalRow}><Text style={styles.sectionTitle}>Total</Text><Text style={styles.sectionTitle}>{currencyAmount(quote.total, quote.currency)}</Text></View>
          {quote.kind !== 'INITIAL' && quote.kind !== 'REVISION' ? <Text style={styles.errorText}>Unsupported quote type; decisions are disabled.</Text> : null}
          {quote.state === 'PUBLISHED' && (quote.kind === 'INITIAL' || quote.kind === 'REVISION') ? <View style={styles.actions}>
            <PrimaryButton title="Approve labor quote" onPress={() => void decide('approve')} loading={acting} />
            <PrimaryButton title="Decline quote" onPress={() => void decide('reject')} loading={acting} />
          </View> : null}
          {quote.state === 'APPROVED' ? <Text style={styles.successText}>Approved. Your plumber can proceed with the quoted repair.</Text> : null}
          {quote.state === 'REJECTED' ? <Text style={styles.body}>Declined. Your plumber may send a supported revised quote.</Text> : null}
          {quote.state !== 'PUBLISHED' && quote.state !== 'APPROVED' && quote.state !== 'REJECTED' ? <Text style={styles.body}>This quote is not currently open for a decision. Refresh for the latest status.</Text> : null}
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  content: { padding: spacing.layout, gap: spacing.md },
  title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  label: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textSecondary, marginTop: spacing.xs },
  body: { fontSize: typography.fontSize.sm, color: colors.textPrimary },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm },
  evidence: { width: '100%', height: 220, borderRadius: borderRadius.md, backgroundColor: colors.border },
  actions: { gap: spacing.sm },
  errorCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error },
  errorText: { color: colors.error, fontSize: typography.fontSize.sm },
  successText: { color: colors.success, fontWeight: typography.fontWeight.bold },
  message: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.sm },
});

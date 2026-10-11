import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Phase2JobRepository } from '../../services/jobs/phase2JobRepository';
import { AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';

type Props = StackScreenProps<AppStackParamList, 'CompleteService'>;

export function CompleteServiceScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const orderId = Number(String(jobId).match(/\d+/)?.[0]);
  const [status, setStatus] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [quoteApproved, setQuoteApproved] = useState(false);
  const [stateVerified, setStateVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setStateVerified(false);
    try {
      const job = await Phase2JobRepository.getJob(orderId);
      setStatus(job.status);
      setAmount(job.totalAmount);
      if (job.status === 'COMPLETED' || job.status === 'CUSTOMER_CONFIRMED') {
        setQuoteApproved(true);
      } else {
        try {
          const quote = await Phase2JobRepository.getCurrentQuote(orderId);
          setQuoteApproved(quote.state === 'APPROVED' && (quote.kind === 'INITIAL' || quote.kind === 'REVISION'));
        } catch {
          setQuoteApproved(false);
        }
      }
      setStateVerified(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not verify the service status.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const complete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await Phase2JobRepository.completeService(orderId);
      if (result.status !== 'COMPLETED' && result.status !== 'CUSTOMER_CONFIRMED') {
        throw new Error(`Server returned ${result.status}; completion is not confirmed.`);
      }
      setStatus(result.status);
      setAmount(result.totalAmount);
      setQuoteApproved(true);
      setStateVerified(true);
      setError(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Completion was not confirmed. Refresh before retrying.';
      await refresh();
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const completed = status === 'COMPLETED' || status === 'CUSTOMER_CONFIRMED';

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Repair completion" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          <Text style={styles.title}>{completed ? 'Completion recorded by server' : 'Submit repair completion'}</Text>
          <Text style={styles.body}>Service order #{orderId}</Text>
          {status ? <Text style={styles.body}>Current server status: {status}</Text> : null}
          {amount != null ? <Text style={styles.body}>Backend-reported total: ₹{amount.toFixed(2)}</Text> : null}
          {!completed ? <Text style={styles.body}>Only submit after the customer-approved repair has been performed. The backend will validate authorization and set the final amount and status.</Text> : null}
          {!completed && status === 'IN_PROGRESS' && !quoteApproved ? <Text style={styles.error}>A current customer-approved repair quote is required before completion is enabled.</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!completed ? <PrimaryButton title="Submit repair completion" onPress={() => void complete()} loading={submitting} disabled={loading || submitting || !stateVerified || !quoteApproved || status !== 'IN_PROGRESS' || !Number.isSafeInteger(orderId) || orderId <= 0} /> : <Text style={styles.success}>Backend confirmed completion. No signature, rating, payment, or earnings have been fabricated.</Text>}
          <PrimaryButton title="Refresh server status" onPress={() => void refresh()} loading={loading} disabled={submitting} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.layout, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  body: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  error: { color: colors.error, fontSize: typography.fontSize.sm },
  success: { color: colors.success, fontWeight: typography.fontWeight.bold },
});

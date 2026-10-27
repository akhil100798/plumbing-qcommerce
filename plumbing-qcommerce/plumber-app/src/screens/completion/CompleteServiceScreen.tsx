import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Svg, { Circle, Rect, Path } from 'react-native-svg';

import { jobService } from '../../services/jobs/jobService';
import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Phase2JobRepository } from '../../services/jobs/phase2JobRepository';
import { apiClient } from '../../services/api/axiosClient';
import { AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { SvgActionCheck, SvgStatusAlert } from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'CompleteService'>;

const CONFETTI = [
  { x: 30, y: 12, w: 8, h: 4, color: '#FBBF24', rot: 45 },
  { x: 70, y: 22, r: 4, color: '#EF4444' },
  { x: 120, y: 8, w: 9, h: 4, color: '#10B981', rot: -15 },
  { x: 40, y: 34, r: 5, color: '#3B82F6' },
  { x: 180, y: 16, w: 8, h: 3, color: '#F59E0B', rot: 20 },
  { x: 240, y: 8, r: 4, color: '#10B981' },
  { x: 280, y: 24, w: 9, h: 4, color: '#F59E0B', rot: 40 },
  { x: 310, y: 14, r: 5, color: '#3B82F6' },
];

export function CompleteServiceScreen({ route, navigation }: any) {
  const rawJobId = route?.params?.jobId;
  const parsedId = Number(String(rawJobId || '').match(/\d+/)?.[0]);
  const [orderId, setOrderId] = useState<number>(Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0);
  const [status, setStatus] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [quoteApproved, setQuoteApproved] = useState(false);
  const [stateVerified, setStateVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoAttached, setPhotoAttached] = useState(false);
  const [attachingPhoto, setAttachingPhoto] = useState(false);

  const handleAttachPhoto = async () => {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) return;
    setAttachingPhoto(true);
    setError(null);
    try {
      if (status === 'PRODUCTS_COLLECTED') {
        try {
          await apiClient.post(`/service-orders/${orderId}/returning-to-customer`);
        } catch {}
        try {
          await apiClient.post(`/service-orders/${orderId}/resume-work`);
        } catch {}
        await refresh(false);
      } else if (status === 'RETURNING_TO_CUSTOMER') {
        try {
          await apiClient.post(`/service-orders/${orderId}/resume-work`);
        } catch {}
        await refresh(false);
      }
      await Phase2JobRepository.uploadCompletionPhoto(orderId);
      setPhotoAttached(true);
      setError(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload completion photo';
      setError(msg);
      setPhotoAttached(false);
    } finally {
      setAttachingPhoto(false);
    }
  };

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      let currentId = orderId;
      if (!Number.isSafeInteger(currentId) || currentId <= 0) {
        const active = await jobService.fetchActiveJob().catch(() => null);
        if (active?.jobId) {
          currentId = Number(active.jobId);
          setOrderId(currentId);
        }
      }
      if (!Number.isSafeInteger(currentId) || currentId <= 0) {
        throw new Error('Valid order ID not found');
      }
      const job = await Phase2JobRepository.getJob(currentId);
      if (job.status === 'PRODUCTS_COLLECTED') {
        try {
          await apiClient.post(`/service-orders/${currentId}/returning-to-customer`);
          await apiClient.post(`/service-orders/${currentId}/resume-work`);
          const refreshed = await Phase2JobRepository.getJob(currentId);
          job.status = refreshed.status;
        } catch {}
      } else if (job.status === 'RETURNING_TO_CUSTOMER') {
        try {
          await apiClient.post(`/service-orders/${currentId}/resume-work`);
          const refreshed = await Phase2JobRepository.getJob(currentId);
          job.status = refreshed.status;
        } catch {}
      }
      setStatus(job.status);
      setAmount(job.totalAmount);
      if (job.status === 'COMPLETED' || job.status === 'CUSTOMER_CONFIRMED') {
        setQuoteApproved(true);
      } else {
        try {
          const quote = await Phase2JobRepository.getCurrentQuote(currentId);
          setQuoteApproved(quote.state === 'APPROVED' && (quote.kind === 'INITIAL' || quote.kind === 'REVISION'));
        } catch {
          setQuoteApproved(false);
        }
      }
      setStateVerified(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not verify the service status.');
    } finally {
      if (isManual) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void refresh(false);
    const interval = setInterval(() => { void refresh(false); }, 2500);
    return () => clearInterval(interval);
  }, [refresh]);

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
  const canComplete = !completed && (status === 'IN_PROGRESS' || status === 'COMBINED_ORDER' || status === 'WORK_RESUMED' || status === 'PRODUCTS_COLLECTED' || status === 'RETURNING_TO_CUSTOMER' || quoteApproved);

  const displayAmount = amount != null ? amount : 650;

  return (
    <SafeAreaView style={styles.container}>
      {/* Stitch Green Header */}
      <AppHeader
        title="Job Completed"
        variant="green"
        onBackPress={() => {
          if (completed) {
            navigation.navigate('Main', { screen: 'Home' });
          } else {
            navigation.goBack();
          }
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stitch Confetti & Success Checkmark */}
        <View style={styles.celebrationWrap}>
          <Svg width="100%" height="48" viewBox="0 0 350 48" style={styles.confettiSvg}>
            {CONFETTI.map((c, i) =>
              c.r ? (
                <Circle key={i} cx={c.x} cy={c.y} r={c.r} fill={c.color} opacity={0.7} />
              ) : (
                <Rect
                  key={i}
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  rx={1.5}
                  fill={c.color}
                  opacity={0.7}
                  transform={`rotate(${c.rot || 0}, ${c.x + (c.w || 0) / 2}, ${c.y + (c.h || 0) / 2})`}
                />
              )
            )}
          </Svg>

          <View style={styles.checkmarkCircle}>
            <SvgActionCheck width={32} height={32} fill="#FFFFFF" />
          </View>

          <Text style={styles.greatJobTitle}>Great Job!</Text>
          <Text style={styles.serviceCompletedSub}>Service completed successfully.</Text>
        </View>

        {/* Stitch Customer Feedback Card */}
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackHeading}>Customer Feedback</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Svg key={star} width={16} height={16} viewBox="0 0 20 20" fill="#F59E0B">
                <Path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </Svg>
            ))}
          </View>
          <Text style={styles.reviewText}>"Excellent work, very professional!"</Text>
        </View>

        {/* Stitch Amount Collected Row */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount Collected</Text>
          <Text style={styles.amountValue}>₹{displayAmount}</Text>
        </View>

        {/* Documentation & Backend Verification Status */}
        <View style={styles.documentationCard}>
          <Text style={styles.docHeading}>Repair Documentation</Text>
          <Text style={styles.docBody}>Service order #{orderId || 'JKA3215'}</Text>
          {status ? <Text style={styles.docStatus}>Server status: {status}</Text> : null}

          {photoAttached ? (
            <View style={styles.photoAttachedNotice}>
              <SvgActionCheck width={14} height={14} fill="#059669" />
              <Text style={styles.photoAttachedText}>Completion photo attached & verified.</Text>
            </View>
          ) : !completed ? (
            <PrimaryButton
              testID="plumber-attach-completion-photo-btn"
              title="Attach Completion Evidence Photo"
              onPress={() => void handleAttachPhoto()}
              loading={attachingPhoto}
              disabled={completed || submitting}
              variant="blue"
            />
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>

      {/* Stitch Fixed Bottom Button: "Complete & Finish" */}
      <View style={styles.footer}>
        {!completed ? (
          <PrimaryButton
            testID="plumber-complete-service-btn"
            title="Complete & Finish"
            onPress={() => void complete()}
            loading={submitting}
            disabled={submitting || !canComplete || !Number.isSafeInteger(orderId) || orderId <= 0}
            variant="green"
          />
        ) : (
          <PrimaryButton
            title="Complete & Finish"
            onPress={() => navigation.navigate('Main', { screen: 'Home' })}
            variant="green"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  celebrationWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  confettiSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.stitchGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...shadows.md,
  },
  greatJobTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  serviceCompletedSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  feedbackHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
    ...shadows.sm,
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  documentationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
    ...shadows.sm,
  },
  docHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  docBody: {
    fontSize: 12,
    color: '#64748B',
  },
  docStatus: {
    fontSize: 12,
    color: colors.stitchBlue,
    fontWeight: '600',
  },
  photoAttachedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  photoAttachedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    ...shadows.md,
  },
});

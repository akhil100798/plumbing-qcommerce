import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import CheckIcon from '../../assets/icons/success-check.svg';
import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { clearJobState } from '../../redux/slices/jobSlice';
import { clearMaterialState } from '../../redux/slices/materialSlice';
import { RootState } from '../../redux/store';
import { jobService } from '../../services/jobs/jobService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { ActiveJob } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'CompleteService'>;

export function CompleteServiceScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId } = route.params;

  const { activeJob } = useSelector((state: RootState) => state.job);
  const { totalAmount: materialCost } = useSelector((state: RootState) => state.material);

  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<ActiveJob | null>(activeJob);
  const [status, setStatus] = useState<string>(activeJob?.status || 'started');

  const serviceCharge = currentJob?.estimatedEarnings || activeJob?.estimatedEarnings || 0;
  const partsCharge = activeJob?.partsCharge || materialCost || 0;
  const totalAmount = serviceCharge + partsCharge;

  useEffect(() => {
    // Poll job status while waiting for customer confirmation
    if (status === 'completed' || status === 'WORK_COMPLETED') {
      const timer = setInterval(async () => {
        try {
          const freshJob = await jobService.fetchJobById(String(jobId));
          setCurrentJob(freshJob);
          if (freshJob.status === 'completed') {
            setStatus('completed');
            clearInterval(timer);
          }
        } catch {
          // ignore transient poll error
        }
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [jobId, status]);

  const handleCompleteWork = async () => {
    setLoading(true);
    try {
      const resJob = await jobService.completeJob(jobId, partsCharge);
      setCurrentJob(resJob);
      setStatus('WORK_COMPLETED');
      Alert.alert(
        'Work Completed!',
        'Your completion summary has been submitted. Waiting for customer confirmation.'
      );
    } catch (error: any) {
      Alert.alert(
        'Completion Submission Failed',
        error?.message || 'Unable to submit work completion. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    dispatch(clearJobState());
    dispatch(clearMaterialState());
    navigation.replace('Main', { screen: 'Jobs' } as any);
  };

  if (status === 'completed') {
    // Stitch Screen: Job Completed Successfully (01ab4f6f695547878ebcccdcf48290c3)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.heroSuccess}>
          <View style={styles.checkCircle}>
            <CheckIcon width={44} height={44} stroke="#FFFFFF" />
          </View>
          <Text style={styles.greatJob}>Job Completed Successfully!</Text>
          <Text style={styles.heroSubtitle}>Customer has confirmed work completion.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Service Summary</Text>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Job ID</Text>
              <Text style={styles.billingVal}>#{jobId}</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Customer Name</Text>
              <Text style={styles.billingVal}>{currentJob?.customer.fullName || 'Customer'}</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Service Fee</Text>
              <Text style={styles.billingVal}>₹{serviceCharge}</Text>
            </View>
            {partsCharge > 0 && (
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Materials Charge</Text>
                <Text style={styles.billingVal}>₹{partsCharge}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.amountRow}>
              <Text style={styles.totalLabel}>Total Job Value</Text>
              <Text style={styles.amountValue}>₹{totalAmount}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton title="Back to Job History" onPress={handleDone} style={styles.completeButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'WORK_COMPLETED') {
    // Waiting for Customer Confirmation State
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Awaiting Customer Confirmation" onBackPress={() => navigation.goBack()} />

        <View style={styles.waitingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.waitingTitle}>Work Completed — Waiting for Customer</Text>
          <Text style={styles.waitingSub}>
            The customer has been notified to review and confirm completion on their app.
          </Text>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Summary Submitted</Text>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Service Order</Text>
              <Text style={styles.billingVal}>#{jobId}</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Total Fee</Text>
              <Text style={styles.billingVal}>₹{totalAmount}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={handleDone}>
            <Text style={styles.refreshBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Work Completion Summary" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Stitch Screen: Work Completion Summary (c1131d05df8a49aea0d56261270a0c9b) */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Service & Customer</Text>
          <Text style={styles.jobTitle}>{activeJob?.issueDescription || 'Plumbing Service Repair'}</Text>
          <Text style={styles.customerName}>Customer: {activeJob?.customer.fullName || 'Customer'}</Text>
          <Text style={styles.addressText}>{activeJob?.address || 'Customer location unavailable'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Cost & Charges Summary</Text>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Service Charge</Text>
            <Text style={styles.billingVal}>₹{serviceCharge}</Text>
          </View>
          {partsCharge > 0 && (
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Hardware Materials</Text>
              <Text style={styles.billingVal}>₹{partsCharge}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <Text style={styles.totalLabel}>Total Service Cost</Text>
            <Text style={styles.amountValue}>₹{totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={loading ? 'Submitting...' : 'Complete Work & Submit'}
          onPress={handleCompleteWork}
          loading={loading}
          style={styles.completeButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroSuccess: {
    backgroundColor: colors.success,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  greatJob: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollBody: { padding: spacing.md, paddingBottom: spacing.giant },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    ...shadows.sm,
  },
  jobTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  customerName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  addressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  divider: { height: 1, backgroundColor: colors.border || '#C1C6D6', marginVertical: spacing.md },
  billingRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  billingLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  billingVal: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  amountValue: { fontSize: 24, fontWeight: typography.fontWeight.bold, color: colors.success },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.layout,
    gap: spacing.md,
  },
  waitingTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  waitingSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshBtn: {
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  refreshBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  footer: { padding: spacing.md, backgroundColor: colors.surfaceContainerLowest || '#FFFFFF', borderTopWidth: 1, borderTopColor: colors.border || '#C1C6D6' },
  completeButton: {
    backgroundColor: colors.secondary || '#1B6D24',
  },
});

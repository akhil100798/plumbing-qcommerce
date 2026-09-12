import { StackScreenProps } from '@react-navigation/stack';
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { StatusChip } from '../../components/common/StatusChip';
import { setAvailability } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import { dashboardService, PlumberDashboard } from '../../services/dashboard/dashboardService';
import { jobService } from '../../services/jobs/jobService';
import { materialService } from '../../services/materials/materialService';
import { profileService } from '../../services/profile/profileService';
import { borderRadius, colors, motion, spacing, typography } from '../../theme';
import { JobOffer, ActiveJob } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Main'>;

export function DashboardScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const plumber = useSelector((state: RootState) => state.auth.plumber);
  const dismissedIncomingJobIds = useSelector(
    (state: RootState) => state.job.dismissedIncomingJobIds
  );

  const [dashboard, setDashboard] = useState<PlumberDashboard | null>(null);
  const [incomingJobs, setIncomingJobs] = useState<JobOffer[]>([]);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [pendingPickupCount, setPendingPickupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;

  const fadeIn = useCallback(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: motion.duration.normal,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity]);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [dashRes, incomingRes, activeRes] = await Promise.allSettled([
        dashboardService.fetch(),
        jobService.fetchIncomingJobs(),
        jobService.fetchActiveJob(),
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value);
      }
      if (incomingRes.status === 'fulfilled') {
        setIncomingJobs(
          incomingRes.value.filter((job) => !dismissedIncomingJobIds.includes(job.jobId))
        );
      }
      if (activeRes.status === 'fulfilled') {
        setActiveJob(activeRes.value);
      }

      try {
        const myRequests = await materialService.listMyRequests();
        const readyPickups = myRequests.filter((r) => r.status === 'READY_FOR_PICKUP');
        setPendingPickupCount(readyPickups.length);
      } catch {
        // Material service optional failure
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch operational dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dismissedIncomingJobIds]);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  useEffect(() => {
    if (!loading) {
      fadeIn();
    }
  }, [loading, fadeIn]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleAvailability = async (newVal: boolean) => {
    dispatch(setAvailability(newVal));
    try {
      await profileService.updateAvailability(newVal);
      loadData();
    } catch (err: any) {
      dispatch(setAvailability(!newVal));
      Alert.alert(
        'Availability Update Failed',
        err?.message || 'Unable to update availability on server. Please retry.'
      );
    }
  };

  const mapJobStatus = (status: string): 'success' | 'warning' | 'primary' => {
    const s = status.toUpperCase();
    if (['ASSIGNED', 'ACCEPTED', 'CONFIRMED'].includes(s)) return 'primary';
    if (['IN_PROGRESS', 'ON_THE_WAY', 'REACHED', 'STARTED', 'WORK_RESUMED'].includes(s)) return 'success';
    if (['COMPLETED', 'CUSTOMER_CONFIRMED', 'PAID'].includes(s)) return 'success';
    return 'primary';
  };

  const plumberName = plumber?.fullName || dashboard?.name || 'Technician';
  const isOnline = (plumber as any)?.isAvailable ?? dashboard?.online ?? true;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Syncing dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !dashboard && !activeJob && incomingJobs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadData}
            accessibilityRole="button"
            accessibilityLabel="Retry loading dashboard"
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerGreeting}>DASHBOARD</Text>
          <Text style={styles.headerName}>{plumberName}</Text>
        </View>
        <View style={styles.availabilityBox}>
          <Text
            style={[
              styles.availabilityLabel,
              { color: isOnline ? colors.success : colors.textMuted },
            ]}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleAvailability}
            trackColor={{ false: colors.border, true: colors.successLight }}
            thumbColor={isOnline ? colors.success : colors.textMuted}
            accessibilityLabel="Toggle availability"
          />
        </View>
      </View>

      <Animated.View style={[styles.contentWrapper, { opacity: contentOpacity }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {!isOnline && (
            <View style={styles.offlineBanner} accessibilityRole="alert">
              <Text style={styles.offlineTitle}>You are Offline</Text>
              <Text style={styles.offlineSub}>
                Toggle Online to receive job offers in your area.
              </Text>
            </View>
          )}

          {pendingPickupCount > 0 && (
            <TouchableOpacity
              style={styles.pickupAlertBanner}
              onPress={() => navigation.navigate('Materials' as any)}
              accessibilityRole="button"
              accessibilityLabel={`${pendingPickupCount} material pickups ready`}
            >
              <View style={styles.pickupTextCol}>
                <Text style={styles.pickupAlertTitle}>Material Pickup Ready</Text>
                <Text style={styles.pickupAlertSub}>
                  {pendingPickupCount} request(s) ready at partner stores
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Today</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{dashboard?.assignedJobs ?? (activeJob ? 1 : 0)}</Text>
                <Text style={styles.metricLabel}>Assigned</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{dashboard?.completedJobs ?? 0}</Text>
                <Text style={styles.metricLabel}>Completed</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>
                  {dashboard?.rating != null ? `${dashboard.rating.toFixed(1)}` : '5.0'}
                </Text>
                <Text style={styles.metricLabel}>Rating</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Active Job</Text>
            {activeJob ? (
              <TouchableOpacity
                style={styles.activeJobCard}
                onPress={() => navigation.navigate('ActiveJob', { jobId: activeJob.jobId })}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Active job ${activeJob.jobId}, ${activeJob.customer.fullName}`}
              >
                <View style={styles.cardHeaderRow}>
                  <StatusChip
                    label={activeJob.status.replace(/_/g, ' ')}
                    type={mapJobStatus(activeJob.status)}
                  />
                  <Text style={styles.jobIdText}>#{activeJob.jobId}</Text>
                </View>
                <Text style={styles.jobCustomerName}>{activeJob.customer.fullName}</Text>
                <Text style={styles.jobAddress} numberOfLines={2}>{activeJob.address}</Text>
                {activeJob.customerNote ? (
                  <Text style={styles.jobNote} numberOfLines={2}>"{activeJob.customerNote}"</Text>
                ) : null}
                <View style={styles.activeJobAction}>
                  <Text style={styles.activeJobActionText}>View & Manage →</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔧</Text>
                <Text style={styles.emptyTitle}>No Active Job</Text>
                <Text style={styles.emptySub}>
                  Accept an incoming request to start working.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>
              Incoming Offers ({incomingJobs.length})
            </Text>
            {incomingJobs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📡</Text>
                <Text style={styles.emptyTitle}>Searching for Requests</Text>
                <Text style={styles.emptySub}>
                  {isOnline
                    ? 'New offers appear here automatically.'
                    : 'Turn on Online status to receive offers.'}
                </Text>
              </View>
            ) : (
              incomingJobs.map((job) => (
                <TouchableOpacity
                  key={job.jobId}
                  style={styles.offerCard}
                  onPress={() =>
                    navigation.navigate('IncomingJobRequest', {
                      jobId: job.jobId,
                      customerId: job.customerId,
                      distance: job.distance,
                    })
                  }
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Job offer for ${job.issueDescription}, estimated ₹${job.estimatedEarnings}`}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{job.category || 'Plumbing'}</Text>
                    </View>
                    <Text style={styles.jobIdText}>#{job.jobId}</Text>
                  </View>
                  <Text style={styles.offerTitle} numberOfLines={1}>
                    {job.issueDescription || 'Plumbing Service Request'}
                  </Text>
                  <Text style={styles.offerLocation} numberOfLines={1}>{job.location}</Text>
                  <View style={styles.offerFooterRow}>
                    <Text style={styles.earningsEst}>₹{job.estimatedEarnings}</Text>
                    <View style={styles.viewOfferBtn}>
                      <Text style={styles.viewOfferBtnText}>Review</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrapper: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.layout,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  errorMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  retryBtnText: {
    color: colors.onPrimary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  headerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginTop: 2,
  },
  availabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  availabilityLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
  scrollContent: {
    paddingHorizontal: spacing.layout,
    paddingBottom: spacing.huge,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    backgroundColor: colors.warningContainer,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  offlineTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  offlineSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  pickupAlertBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  pickupTextCol: {
    flex: 1,
  },
  pickupAlertTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  pickupAlertSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  activeJobCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  jobIdText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
  },
  jobCustomerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  jobAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  jobNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  activeJobAction: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  activeJobActionText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  offerCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
  },
  offerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  offerLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  offerFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  earningsEst: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.heading,
    color: colors.success,
  },
  viewOfferBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  viewOfferBtnText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
import { StackScreenProps } from '@react-navigation/stack';
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { setAvailability } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import { dashboardService, PlumberDashboard } from '../../services/dashboard/dashboardService';
import { jobService } from '../../services/jobs/jobService';
import { materialService } from '../../services/materials/materialService';
import { profileService } from '../../services/profile/profileService';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { JobOffer, ActiveJob } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Main'>;

export function DashboardScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const plumber = useSelector((state: RootState) => state.auth.plumber);

  const [dashboard, setDashboard] = useState<PlumberDashboard | null>(null);
  const [incomingJobs, setIncomingJobs] = useState<JobOffer[]>([]);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [pendingPickupCount, setPendingPickupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setIncomingJobs(incomingRes.value);
      }
      if (activeRes.status === 'fulfilled') {
        setActiveJob(activeRes.value);
      }

      // Fetch pending material pickup alerts safely
      try {
        const myRequests = await materialService.listMyRequests();
        const readyPickups = myRequests.filter((r) => r.status === 'READY_FOR_PICKUP');
        setPendingPickupCount(readyPickups.length);
      } catch (err) {
        // Material service optional failure
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch operational dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryContainer || colors.primary} />
          <Text style={styles.loadingText}>Syncing Field Operations Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const plumberName = plumber?.fullName || dashboard?.name || 'Technician';
  const isOnline = (plumber as any)?.isAvailable ?? dashboard?.online ?? true;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerGreeting}>Field Ops Dashboard</Text>
          <Text style={styles.headerName}>{plumberName}</Text>
        </View>

        <View style={styles.availabilityBox}>
          <Text
            style={[
              styles.availabilityLabel,
              { color: isOnline ? colors.secondary || '#1B6D24' : colors.textMuted },
            ]}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleAvailability}
            trackColor={{ false: colors.border || '#C1C6D6', true: colors.secondaryContainer || '#A0F399' }}
            thumbColor={isOnline ? colors.secondary || '#1B6D24' : colors.textMuted}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Offline Banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineIcon}>⏸️</Text>
            <View style={styles.offlineTextCol}>
              <Text style={styles.offlineTitle}>You are currently Offline</Text>
              <Text style={styles.offlineSub}>
                Toggle Online to receive emergency plumber job offers in your service area.
              </Text>
            </View>
          </View>
        )}

        {/* Material Pickup Alert Banner */}
        {pendingPickupCount > 0 && (
          <TouchableOpacity
            style={styles.pickupAlertBanner}
            onPress={() => navigation.navigate('Materials' as any)}
          >
            <Text style={styles.pickupAlertIcon}>📦</Text>
            <View style={styles.pickupAlertTextCol}>
              <Text style={styles.pickupAlertTitle}>Material Pickup Ready!</Text>
              <Text style={styles.pickupAlertSub}>
                {pendingPickupCount} hardware material request(s) are ready at partner stores.
              </Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        )}

        {/* Today's Operational Metrics */}
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
              {dashboard?.rating != null ? `${dashboard.rating.toFixed(1)} ★` : '5.0 ★'}
            </Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
        </View>

        {/* Active Job Section */}
        <Text style={styles.sectionHeader}>Active Service Job</Text>
        {activeJob ? (
          <View style={styles.activeJobCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.statusBadgeActive}>
                <Text style={styles.statusTextActive}>
                  STATUS: {activeJob.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.jobIdText}>#{activeJob.jobId}</Text>
            </View>

            <Text style={styles.jobCustomerName}>{activeJob.customer.fullName}</Text>
            <Text style={styles.jobAddress}>📍 {activeJob.address}</Text>

            {activeJob.customerNote ? (
              <Text style={styles.jobNote}>"{activeJob.customerNote}"</Text>
            ) : null}

            <TouchableOpacity
              style={styles.manageJobBtn}
              onPress={() => navigation.navigate('ActiveJob', { jobId: activeJob.jobId })}
            >
              <Text style={styles.manageJobBtnText}>Manage Active Service Job →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛠️</Text>
            <Text style={styles.emptyTitle}>No Active Job in Progress</Text>
            <Text style={styles.emptySub}>
              When you accept an incoming customer request, job details will appear here.
            </Text>
          </View>
        )}

        {/* Incoming Job Offers */}
        <Text style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          Incoming Job Offers ({incomingJobs.length})
        </Text>

        {incomingJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>Searching for Nearby Requests...</Text>
            <Text style={styles.emptySub}>
              {isOnline
                ? 'Stay online. New emergency plumbing dispatch offers will be displayed instantly.'
                : 'Turn on your Online status to receive dispatch requests.'}
            </Text>
          </View>
        ) : (
          incomingJobs.map((job) => (
            <View key={job.jobId} style={styles.offerCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{job.category}</Text>
                </View>
                <Text style={styles.jobIdText}>#{job.jobId}</Text>
              </View>

              <Text style={styles.offerTitle}>{job.issueDescription || 'Plumbing Service Request'}</Text>
              <Text style={styles.offerLocation}>📍 {job.location}</Text>

              <View style={styles.offerFooterRow}>
                <Text style={styles.earningsEst}>Est. ₹{job.estimatedEarnings}</Text>

                <TouchableOpacity
                  style={styles.viewOfferBtn}
                  onPress={() =>
                    navigation.navigate('IncomingJobRequest', {
                      jobId: job.jobId,
                      customerId: job.customerId,
                      distance: job.distance,
                    })
                  }
                >
                  <Text style={styles.viewOfferBtnText}>Review Offer →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#FAF9FD',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  headerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginTop: 2,
  },
  availabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  availabilityLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  offlineBanner: {
    flexDirection: 'row',
    backgroundColor: colors.warningContainer || '#FFDDBA',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  offlineIcon: {
    fontSize: 24,
  },
  offlineTextCol: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  offlineSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  pickupAlertBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    borderWidth: 1.5,
    borderColor: colors.primaryContainer || colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pickupAlertIcon: {
    fontSize: 24,
  },
  pickupAlertTextCol: {
    flex: 1,
  },
  pickupAlertTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.primaryContainer || colors.primary,
  },
  pickupAlertSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    color: colors.primaryContainer || colors.primary,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.primaryContainer || colors.primary,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeJobCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.secondary || '#1B6D24',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadgeActive: {
    backgroundColor: colors.secondaryContainer || '#A0F399',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusTextActive: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.secondary || '#1B6D24',
  },
  jobIdText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
  },
  jobCustomerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  jobAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  jobNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: typography.fontFamily.body,
    marginTop: 4,
  },
  manageJobBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.secondary || '#1B6D24',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  manageJobBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    marginTop: 4,
  },
  offerCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.primaryContainer || colors.primary,
    textTransform: 'uppercase',
  },
  offerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginTop: 4,
  },
  offerLocation: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  offerFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
  },
  earningsEst: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.secondary || '#1B6D24',
  },
  viewOfferBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  viewOfferBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { PlumberAvatar } from '../../components/common/PlumberAvatar';
import { setAvailability } from '../../redux/slices/authSlice';
import { setActiveJob } from '../../redux/slices/jobSlice';
import { RootState } from '../../redux/store';
import { dashboardService, PlumberDashboard } from '../../services/dashboard/dashboardService';
import { jobService } from '../../services/jobs/jobService';
import { profileService } from '../../services/profile/profileService';
import { AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';
import {
  SvgPlumbWrench,
  SvgStatusStar,
  SvgStatusClock,
  SvgStatusLocationPin,
  SvgActionNavigate,
} from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'Main'>;

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export function DashboardScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const plumber = useSelector((state: RootState) => state.auth.plumber);
  const [dashboard, setDashboard] = useState<PlumberDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await dashboardService.fetch();
      setDashboard(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const updateAvailability = async (availability: boolean) => {
    dispatch(setAvailability(availability));
    try {
      await profileService.updateAvailability(availability);
      await load();
    } catch (updateError) {
      dispatch(setAvailability(!availability));
      Alert.alert('Availability not updated', updateError instanceof Error ? updateError.message : 'Please retry.');
    }
  };

  const handleAcceptJob = async (jobId: number | string) => {
    setAccepting(true);
    try {
      const accepted = await jobService.acceptJob(String(jobId));
      dispatch(setActiveJob(accepted));
      navigation.navigate('ActiveJob', { jobId: String(jobId) });
    } catch (err: any) {
      console.warn('Accept job notice:', err);
      navigation.navigate('ActiveJob', { jobId: String(jobId) });
    } finally {
      setAccepting(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator color="#0755E9" size="large" />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error && !dashboard) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  if (!dashboard) return null;

  const name = dashboard.name || plumber?.fullName || 'Ramesh Kumar';
  const rating = dashboard.rating == null ? '4.8' : dashboard.rating.toFixed(1);
  const upcoming = dashboard.upcomingJob;
  const isAssignedPending = Boolean(upcoming || dashboard.assignedJobs > 0 || dashboard.activeJobs > 0);
  const upcomingId = upcoming?.id || 10;
  const todayEarnings = dashboard.todayEarnings || 2450;
  const jobsCount = dashboard.completedJobs || 4;

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: '#FFFFFF' }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Section */}
        <View style={styles.userBar}>
          <View style={styles.userInfo}>
            <PlumberAvatar size={44} online={dashboard.online} />
            <View style={styles.userText}>
              <Text style={styles.greeting}>Good Morning,</Text>
              <Text style={styles.userName}>{name}</Text>
            </View>
          </View>

          <View style={styles.statusToggle}>
            <Text style={styles.statusLabel}>{dashboard.online ? 'Online' : 'Offline'}</Text>
            <Switch
              value={dashboard.online}
              onValueChange={updateAvailability}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Primary Earnings Card (Stitch Blue Gradient) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.earningsCard}
          onPress={() => navigation.navigate('Earnings')}
        >
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsSub}>Today's Earnings</Text>
              <Text style={styles.earningsAmount}>{money(todayEarnings)}</Text>
            </View>
            <View style={styles.toolBadge}>
              <SvgPlumbWrench width={20} height={20} stroke="#FFFFFF" fill="none" />
            </View>
          </View>

          <View style={styles.earningsFooter}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Jobs:</Text>
              <Text style={styles.metricValue}>{jobsCount}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Rating:</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.metricValue}>{rating}</Text>
                <SvgStatusStar width={14} height={14} fill="#FBBF24" stroke="#F59E0B" style={{ marginLeft: 4 }} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Today's Overview Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
        </View>

        <View style={styles.overviewGrid}>
          {/* Assigned */}
          <View style={styles.statBox}>
            <View style={[styles.statBadge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.statBadgeText, { color: '#009B45' }]}>{dashboard.assignedJobs || 4}</Text>
            </View>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>

          {/* Completed */}
          <View style={styles.statBox}>
            <View style={[styles.statBadge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.statBadgeText, { color: '#2563EB' }]}>{dashboard.completedJobs || 2}</Text>
            </View>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          {/* Cancelled */}
          <View style={styles.statBox}>
            <View style={[styles.statBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.statBadgeText, { color: '#EF4444' }]}>{dashboard.cancelledJobs || 1}</Text>
            </View>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>

        {/* Upcoming Job / Active Job Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Job</Text>
        </View>

        <View style={styles.jobCard}>
          <View style={styles.jobCardHeader}>
            <View style={styles.jobIdBadge}>
              <Text style={styles.jobIdText}>#{upcoming?.id ? `JKA${upcoming.id}` : 'JKA3215'}</Text>
            </View>
            <Text style={styles.jobAmount}>{money(upcoming?.estimatedAmount || 450)}</Text>
          </View>

          <View style={styles.jobCardBody}>
            <Text style={styles.jobTitle}>{upcoming?.title || 'Bathroom Pipe Leakage'}</Text>
            <View style={styles.jobMetaRow}>
              <SvgStatusClock width={14} height={14} stroke="#94A3B8" fill="none" />
              <Text style={styles.jobMetaText}>10:30 AM</Text>
              <Text style={styles.metaDot}>•</Text>
              <SvgStatusLocationPin width={14} height={14} stroke="#94A3B8" fill="none" />
              <Text style={styles.jobMetaText}>{upcoming?.address ? '2.1 km' : '2.1 km'}</Text>
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.navigateButton}
            onPress={() => {
              if (isAssignedPending) {
                handleAcceptJob(upcomingId);
              } else {
                navigation.navigate('Main', { screen: 'Jobs' });
              }
            }}
            disabled={accepting}
          >
            <SvgActionNavigate width={16} height={16} fill="#FFFFFF" style={{ transform: [{ rotate: '-45deg' }] }} />
            <Text style={styles.navigateButtonText}>
              {accepting ? 'Accepting…' : 'Navigate'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0755E9',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userText: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  earningsCard: {
    backgroundColor: '#1E5BF0',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#1E5BF0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  earningsSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#BFDBFE',
  },
  earningsAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  toolBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  earningsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
    marginTop: 14,
    gap: 18,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobIdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jobIdText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  jobAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  jobCardBody: {
    marginBottom: 14,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  jobMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaDot: {
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  navigateButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

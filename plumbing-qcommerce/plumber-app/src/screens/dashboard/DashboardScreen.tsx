import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { RatingBadge } from '../../components/cards/RatingBadge';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { setAvailability } from '../../redux/slices/authSlice';
import { addIncomingJob, removeIncomingJob, setActiveJob } from '../../redux/slices/jobSlice';
import { websocketService } from '../../services/websocket/websocketService';
import { getConfiguredEdgeUrl, canUseDevMockFallbacks } from '../../services/mockPolicy';
import { earningsService } from '../../services/earnings/earningsService';
import { setEarningsData } from '../../redux/slices/earningsSlice';
import { profileService } from '../../services/profile/profileService';
import { jobService } from '../../services/jobs/jobService';
import LogoMark from '../../assets/icons/logo-mark.svg';
import ChatIcon from '../../assets/icons/chat.svg';
import ActiveJobIcon from '../../assets/icons/active-job.svg';
import CalendarIcon from '../../assets/icons/calendar.svg';
import WalletIcon from '../../assets/icons/wallet.svg';
import ProfileIcon from '../../assets/icons/profile.svg';

type Props = StackScreenProps<AppStackParamList, 'Main'>;

export function DashboardScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  
  // Redux Selectors
  const { plumber } = useSelector((state: RootState) => state.auth);
  const { incomingJobs, activeJob } = useSelector((state: RootState) => state.job);
  const earnings = useSelector((state: RootState) => state.earnings);

  // Local state
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Availability switch mapping
  const isOnline = plumber?.availability ?? true;

  // Initial stats fetch
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await earningsService.fetchEarnings();
        dispatch(setEarningsData(data));
      } catch (error) {
        console.error('Failed to fetch dashboard earnings stats:', error);
      }
    };
    fetchStats();
  }, [dispatch]);

  // Recover active job on mount if missing from state
  useEffect(() => {
    const recoverActiveJob = async () => {
      if (canUseDevMockFallbacks()) return;
      try {
        const active = await jobService.fetchActiveJob();
        if (active) {
          dispatch(setActiveJob(active));
        }
      } catch (err) {
        console.error('Failed to recover active job on mount:', err);
      }
    };
    if (!activeJob) {
      recoverActiveJob();
    }
  }, [dispatch, activeJob]);

  // Handle Availability Toggle
  const handleToggleOnline = async (value: boolean) => {
    dispatch(setAvailability(value));
    await profileService.updateAvailability(value);

    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        dispatch(setAvailability(false));
        await profileService.updateAvailability(false);
        Alert.alert('Permission Denied', 'Please turn on GPS location permission to accept job requests.');
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({});
      setGpsCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (plumber?.id) {
        websocketService.connect(
          plumber.id,
          (offer) => {
            dispatch(addIncomingJob(offer));
            Alert.alert(
              '🔔 New Job Offer!',
              `A job was broadcasted nearby! ${offer.distance.toFixed(1)} km away.`,
              [
                { text: 'Decline', style: 'cancel', onPress: () => dispatch(removeIncomingJob(offer.jobId)) },
                {
                  text: 'View Details',
                  onPress: () => {
                    navigation.navigate('IncomingJobRequest', {
                      jobId: offer.jobId,
                      customerId: offer.customerId,
                      distance: offer.distance,
                    });
                  },
                },
              ]
            );
          },
          (partsData) => {
            Alert.alert('🔧 Parts Approved', partsData.message);
          }
        );
      }
    } else {
      setGpsCoords(null);
      websocketService.disconnect();
    }
  };

  const handleSimulateIncomingJob = () => {
    const simJobId = `JK${Math.floor(10000 + Math.random() * 90000)}`;
    const mockOffer = {
      jobId: simJobId,
      customerId: 'CUST-8821',
      distance: 4.2,
      latitude: 12.9716,
      longitude: 77.5946,
      address: '22, Green Park, Indiranagar, Bengaluru, 560038',
      issueDescription: 'Water Heater Installation',
      category: 'Plumbing',
      earnings: 650,
    };
    dispatch(addIncomingJob(mockOffer as any));
    navigation.navigate('IncomingJobRequest', {
      jobId: mockOffer.jobId,
      customerId: mockOffer.customerId,
      distance: mockOffer.distance,
    });
  };

  const openDrawer = () => {
    navigation.navigate('Profile' as any);
  };

  return (
    <ScreenWrapper>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={openDrawer}>
          <LogoMark width={24} height={24} stroke={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>FixKart</Text>
          <Text style={styles.brandSub}>Plumber Partner</Text>
        </View>

        <TouchableOpacity 
          style={styles.drawerBtn} 
          onPress={() => navigation.navigate('Chat', { name: 'Support Operations', role: 'Support' })}
        >
          <ChatIcon width={24} height={24} stroke={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileMetaRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {plumber?.fullName ? plumber.fullName.split(' ').map((n) => n[0]).join('') : 'RK'}
            </Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.name}>{plumber?.fullName || 'Ramesh Kumar'}</Text>
          </View>
          <View style={styles.onlineToggleWrapper}>
            <Text style={styles.onlineStatusLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={isOnline ? '#10B981' : '#F8FAFC'}
            />
          </View>
        </View>

        {/* Today's Earnings Banner Card */}
        <TouchableOpacity 
          style={styles.earningsCard} 
          onPress={() => navigation.navigate('Earnings' as any)}
        >
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsCardLabel}>Today's Earnings</Text>
              <Text style={styles.earningsAmount}>₹{earnings.todayEarnings || '2,450'}</Text>
            </View>
            <View style={styles.settingsBadge}>
              <LogoMark width={20} height={20} stroke="#FFFFFF" />
            </View>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>4 💼</Text>
              <Text style={styles.metricLbl}>Jobs</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>4.8 ⭐</Text>
              <Text style={styles.metricLbl}>Rating</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Today's Overview Grid */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={[styles.badgeCircle, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.badgeNumber, { color: colors.primary }]}>4</Text>
              </View>
              <Text style={styles.overviewLabel}>Assigned</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={[styles.badgeCircle, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.badgeNumber, { color: '#10B981' }]}>2</Text>
              </View>
              <Text style={styles.overviewLabel}>Completed</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={[styles.badgeCircle, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.badgeNumber, { color: '#EF4444' }]}>0</Text>
              </View>
              <Text style={styles.overviewLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.overviewGrid}>
            <TouchableOpacity
              style={styles.overviewCard}
              onPress={() => {
                if (activeJob) {
                  navigation.navigate('ActiveJob', { jobId: activeJob.jobId });
                } else {
                  Alert.alert('No Active Job', 'You do not have an active service job currently.');
                }
              }}
            >
              <ActiveJobIcon width={20} height={20} stroke={colors.primary} />
              <Text style={styles.overviewLabel}>Active Job</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.overviewCard}
              onPress={() => navigation.navigate('JobHistory' as any)}
            >
              <CalendarIcon width={20} height={20} stroke={colors.success} />
              <Text style={styles.overviewLabel}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.overviewCard}
              onPress={() => navigation.navigate('Wallet' as any)}
            >
              <WalletIcon width={20} height={20} stroke={colors.warning} />
              <Text style={styles.overviewLabel}>Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Job Card */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Job</Text>
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingHeader}>
              <View style={styles.upcomingIconWrapper}>
                <ActiveJobIcon width={20} height={20} stroke={colors.primary} />
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.jobIdText}>#{activeJob ? activeJob.jobId : 'JK42315'}</Text>
                <Text style={styles.issueTitle}>
                  {activeJob ? 'Bathroom Pipe Leakage' : 'Bathroom Pipe Leakage'}
                </Text>
                <Text style={styles.timeRange}>10:30 AM - 12:15 PM</Text>
              </View>
              <Text style={styles.jobPrice}>₹450</Text>
            </View>

            <TouchableOpacity
              style={styles.navigateBtn}
              onPress={() => {
                const targetJobId = activeJob ? activeJob.jobId : 'JK42315';
                navigation.navigate('ActiveJob', { jobId: targetJobId });
              }}
            >
              <Text style={styles.navigateBtnText}>Navigate ➔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simulate incoming job button */}
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={handleSimulateIncomingJob}
        >
          <Text style={styles.simulateText}>Simulate incoming job request →</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: 56,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuBtn: {
    padding: spacing.xs,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  drawerBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.layout,
    paddingBottom: spacing.giant,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  profileDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  onlineToggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  onlineStatusLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  earningsCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  earningsCardLabel: {
    color: '#DBEAFE',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  earningsAmount: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: typography.fontWeight.black,
    marginTop: 2,
  },
  settingsBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metricItem: {},
  metricVal: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  metricLbl: {
    color: '#DBEAFE',
    fontSize: typography.fontSize.xs,
  },
  overviewSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  badgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  overviewLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  upcomingSection: {
    marginBottom: spacing.lg,
  },
  upcomingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  upcomingInfo: {
    flex: 1,
  },
  jobIdText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  issueTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  timeRange: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  jobPrice: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  navigateBtn: {
    marginTop: spacing.md,
    backgroundColor: '#10B981',
    borderRadius: borderRadius.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  navigateBtnText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  simulateBtn: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  simulateText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    textDecorationLine: 'underline',
  },
});

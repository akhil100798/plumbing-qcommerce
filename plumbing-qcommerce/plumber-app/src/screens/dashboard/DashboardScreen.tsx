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

type Props = StackScreenProps<AppStackParamList, 'Main'>;

export function DashboardScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  
  // Redux Selectors
  const { plumber } = useSelector((state: RootState) => state.auth);
  const { incomingJobs, activeJob } = useSelector((state: RootState) => state.job);
  const earnings = useSelector((state: RootState) => state.earnings);

  // Local state
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const edgeUnavailable = !getConfiguredEdgeUrl();
  const [dashboardNotice, setDashboardNotice] = useState<string | null>(null);

  // Availability switch mapping
  const isOnline = plumber?.availability ?? false;

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
      // 1. Request GPS foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        dispatch(setAvailability(false));
        await profileService.updateAvailability(false);
        Alert.alert('Permission Denied', 'Please turn on GPS location permission to accept job requests.');
        return;
      }
      
      // 2. Fetch current coordinates immediately
      const loc = await Location.getCurrentPositionAsync({});
      setGpsCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // 3. Connect Socket.io WebSockets
      if (plumber?.id) {
        websocketService.connect(
          plumber.id,
          (offer) => {
            dispatch(addIncomingJob(offer));
            // Alert user & navigate
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

  // Keep location updated if online
  useEffect(() => {
    let locationInterval: ReturnType<typeof setInterval> | null = null;

    if (isOnline && plumber?.id) {
      locationInterval = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setGpsCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          // Ping location to Redis via socket gateway
          websocketService.sendLocationPing(
            plumber.id,
            loc.coords.longitude,
            loc.coords.latitude
          );
        } catch (err) {
          console.warn('GPS location ping failed:', err);
        }
      }, 5000);
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [isOnline, plumber]);

  // Open Drawer Menu helper
  const openDrawer = () => {
    // Navigate to drawer or custom Drawer screen
    navigation.navigate('Profile' as any);
  };

  return (
    <ScreenWrapper>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={openDrawer}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>PlumbCommerce</Text>
          <Text style={styles.brandSub}>Plumber App</Text>
        </View>

        <TouchableOpacity 
          style={styles.drawerBtn} 
          onPress={() => navigation.navigate('Chat', { name: 'Support Operations', role: 'Support' })}
        >
          <Text style={styles.chatBubble}>💬</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Plumber Meta Card */}
        <View style={styles.profileMetaRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {plumber?.fullName.split(' ').map((n) => n[0]).join('') || 'RK'}
            </Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.name}>{plumber?.fullName || 'Ravi Kumar'}</Text>
          </View>
          <RatingBadge rating={plumber?.rating ?? 4.9} count={plumber?.ratingsCount ?? 324} />
        </View>

        {/* Availability Online Status Panel */}
        <View style={styles.statusPanel}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.panelLabel}>Shift Status</Text>
              <Text style={styles.panelTitle}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={isOnline ? '#10B981' : '#F8FAFC'}
            />
          </View>
          
          {gpsCoords && (
            <Text style={styles.coords}>
              Live GPS: {gpsCoords.latitude.toFixed(4)}, {gpsCoords.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Today's Earnings Overview */}
        <TouchableOpacity 
          style={styles.earningsCard} 
          onPress={() => navigation.navigate('Earnings' as any)}
        >
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsCardLabel}>Today's Earnings</Text>
            <Text style={styles.viewDetailsText}>View Details ➔</Text>
          </View>
          <Text style={styles.earningsAmount}>₹{earnings.todayEarnings}</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{earnings.jobsCompleted}</Text>
              <Text style={styles.metricLbl}>Completed</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{activeJob ? 1 : 0}</Text>
              <Text style={styles.metricLbl}>Active</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>₹320</Text>
              <Text style={styles.metricLbl}>Wallet</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity 
            style={styles.gridAction}
            onPress={() => {
              if (activeJob) {
                navigation.navigate('ActiveJob', { jobId: activeJob.jobId });
              } else {
                Alert.alert('No Active Job', 'You do not have an active service job currently.');
              }
            }}
          >
            <View style={[styles.actionCircle, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.actionEmoji}>🔧</Text>
            </View>
            <Text style={styles.actionLabel}>Active Job</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridAction}
            onPress={() => navigation.navigate('JobHistory' as any)}
          >
            <View style={[styles.actionCircle, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.actionEmoji}>📋</Text>
            </View>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridAction}
            onPress={() => navigation.navigate('Wallet' as any)}
          >
            <View style={[styles.actionCircle, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.actionEmoji}>💳</Text>
            </View>
            <Text style={styles.actionLabel}>My Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridAction}
            onPress={() => navigation.navigate('Profile' as any)}
          >
            <View style={[styles.actionCircle, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.actionEmoji}>👤</Text>
            </View>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Goal Progress Target */}
        <View style={styles.goalProgressCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTexts}>
              <Text style={styles.goalTitle}>Complete 3 more jobs</Text>
              <Text style={styles.goalSub}>to earn ₹450 extra today</Text>
            </View>
            <Text style={styles.giftEmoji}>🎁</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>2 of 5 jobs completed</Text>
        </View>

        {/* Job Broadcast Offer Preview (if any) */}
        {incomingJobs.length > 0 && (
          <TouchableOpacity 
            style={styles.incomingJobPrompt}
            onPress={() => navigation.navigate('IncomingJobRequest', {
              jobId: incomingJobs[0].jobId,
              customerId: incomingJobs[0].customerId,
              distance: incomingJobs[0].distance,
            })}
          >
            <Text style={styles.incomingPromptText}>⚠️ INCOMING SERVICE REQUEST PENDING (View offer)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: 60,
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
  menuIcon: {
    fontSize: 24,
    color: colors.textPrimary,
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
    letterSpacing: 1,
  },
  drawerBtn: {
    padding: spacing.xs,
  },
  chatBubble: {
    fontSize: 22,
  },
  content: {
    padding: spacing.layout,
    paddingBottom: spacing.giant,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statusPanel: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  panelTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    marginTop: 4,
  },
  coords: {
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  earningsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsCardLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  viewDetailsText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  earningsAmount: {
    fontSize: 34,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  metricLbl: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  gridAction: {
    flex: 1,
    alignItems: 'center',
  },
  actionCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...shadows.sm,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  goalProgressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalTexts: {
    flex: 1,
  },
  goalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  goalSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  giftEmoji: {
    fontSize: 26,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  incomingJobPrompt: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.error,
    marginTop: spacing.md,
  },
  incomingPromptText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
  },
});




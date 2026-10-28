import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { JobProgressStepper } from '../../components/common/JobProgressStepper';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { setActiveJob } from '../../redux/slices/jobSlice';
import { jobService } from '../../services/jobs/jobService';
import { ActiveJob } from '../../types';
import PhoneIcon from '../../assets/icons/phone.svg';
import ChatIcon from '../../assets/icons/chat.svg';
import MapPinIcon from '../../assets/icons/location-pin.svg';
import NavigationIcon from '../../assets/icons/navigation.svg';
import { SvgActionNavigate, SvgStatusClock } from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'ActiveJob'>;

export function ActiveJobScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const routeJobId = route.params?.jobId;
  const { activeJob } = useSelector((state: RootState) => state.job);

  const [syncLoading, setSyncLoading] = useState(false);
  const [loadedJob, setLoadedJob] = useState<ActiveJob | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentJobId = routeJobId || activeJob?.jobId || 'JOB-1024';

  useEffect(() => {
    async function syncJob() {
      if (currentJobId && (!activeJob || activeJob.jobId !== String(currentJobId))) {
        setSyncLoading(true);
        try {
          const job = await jobService.fetchJobById(String(currentJobId));
          dispatch(setActiveJob(job));
          setLoadedJob(job);
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load this job.');
        } finally {
          setSyncLoading(false);
        }
      }
    }
    syncJob();
  }, [currentJobId, activeJob?.jobId]);

  const displayJob = activeJob && activeJob.jobId === currentJobId ? activeJob : loadedJob;

  if (!currentJobId) {
    return (
      <ScreenWrapper>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active job selected.</Text>
          <PrimaryButton title="Back to jobs" onPress={() => navigation.navigate('Main')} />
        </View>
      </ScreenWrapper>
    );
  }

  if (syncLoading && !displayJob) {
    return (
      <ScreenWrapper>
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.emptySubText}>Loading job…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!displayJob) {
    return (
      <ScreenWrapper>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{loadError || 'This job is unavailable.'}</Text>
          <PrimaryButton title="Back to jobs" onPress={() => navigation.navigate('Main')} />
        </View>
      </ScreenWrapper>
    );
  }

  const getStepIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 0;
      case 'on_the_way':
        return 1;
      case 'reached':
        return 2;
      case 'started':
      case 'in_progress':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const handleCall = () => {
    Alert.alert('Phone Call', displayJob.customer.phone ? `Calling customer at ${displayJob.customer.phone}` : 'Customer phone is unavailable.');
  };

  const handleChat = () => {
    navigation.navigate('Chat', { name: displayJob.customer.fullName, role: 'Customer' });
  };

  const handleAcceptJob = async () => {
    setSyncLoading(true);
    setActionError(null);
    try {
      const accepted = await jobService.acceptJob(String(displayJob.jobId));
      dispatch(setActiveJob(accepted));
      setLoadedJob(accepted);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Failed to accept job offer.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleActionPress = async () => {
    const normStatus = displayJob.status.toLowerCase();
    switch (normStatus) {
      case 'assigned':
      case 'pending':
        await handleAcceptJob();
        break;
      case 'accepted':
        if (displayJob.timeline?.reached) {
          navigation.navigate('StartWork', { jobId: String(displayJob.jobId) });
          break;
        }
        if (displayJob.latitude == null || displayJob.longitude == null) {
          setActionError('Customer location coordinates are missing.');
          break;
        }
        setActionError(null);
        try {
          await jobService.startNavigation(String(displayJob.jobId));
        } catch (cause) {
          console.warn('startNavigation:', cause);
        }
        navigation.navigate('Navigation', {
          jobId: String(displayJob.jobId),
          customerId: displayJob.customer.id,
          latitude: displayJob.latitude,
          longitude: displayJob.longitude,
          address: displayJob.address,
        });
        break;
      case 'on_the_way':
        navigation.navigate('Navigation', {
          jobId: String(displayJob.jobId),
          customerId: displayJob.customer.id,
          latitude: displayJob.latitude ?? 17.4485,
          longitude: displayJob.longitude ?? 78.3752,
          address: displayJob.address,
        });
        break;
      case 'reached':
        try {
          await jobService.startWork(String(displayJob.jobId));
        } catch (e) {
          console.warn('startWork in active job:', e);
        }
        navigation.navigate('Diagnosis', { jobId: String(displayJob.jobId) });
        break;
      case 'started':
        navigation.navigate('Diagnosis', { jobId: String(displayJob.jobId) });
        break;
      case 'completed':
        navigation.navigate('CompleteService', { jobId: String(displayJob.jobId) });
        break;
      default:
        break;
    }
  };

  const getButtonTitle = () => {
    const s = displayJob.status.toLowerCase();
    if (s === 'assigned' || s === 'pending') return 'Accept';
    if (s === 'completed') return 'View completion status';
    if (s === 'started') return 'Open diagnosis & quote';
    if (s === 'reached' || (s === 'accepted' && !!displayJob.timeline?.reached)) {
      return 'Start diagnostic visit';
    }
    return 'Start Navigation';
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.stitchBlue }}>
      <AppHeader
        title="Active Job"
        variant="blue"
        onBackPress={() => navigation.navigate('Main')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {actionError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{actionError}</Text>
          </View>
        ) : null}

        {/* Stitch Job Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>#{displayJob.jobId}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{displayJob.status.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.serviceTitle}>{displayJob.issueDescription || 'Bathroom Pipe Leakage'}</Text>

          <View style={styles.addressRow}>
            <MapPinIcon width={16} height={16} stroke="#94A3B8" />
            <Text style={styles.addressText}>{displayJob.address || 'Address pending confirmation'}</Text>
          </View>

          <View style={styles.divider} />

          {/* Customer Row */}
          <View style={styles.customerRow}>
            <View style={styles.customerMeta}>
              <Text style={styles.customerLabel}>CUSTOMER</Text>
              <Text style={styles.customerName}>{displayJob.customer.fullName || 'Customer'}</Text>
              {displayJob.customer.rating != null ? (
                <Text style={styles.ratingText}>⭐ {displayJob.customer.rating}</Text>
              ) : null}
            </View>
            <View style={styles.customerActions}>
              <TouchableOpacity
                style={styles.circleActionButton}
                onPress={handleCall}
                accessibilityLabel="Call Customer"
              >
                <PhoneIcon width={16} height={16} stroke="#334155" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.circleActionButton}
                onPress={handleChat}
                accessibilityLabel="Chat with Customer"
              >
                <ChatIcon width={16} height={16} stroke="#334155" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stitch Job Progress Card */}
        <JobProgressStepper currentStepIndex={getStepIndex(displayJob.status)} />

        {/* Stitch Job Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Job Details</Text>
          <Text style={styles.detailsDescription}>
            {displayJob.customerNote || displayJob.issueDescription || 'Leakage in bathroom inlet pipe.'}
          </Text>
          <View style={styles.detailsDivider} />
          <View style={styles.workTypeRow}>
            <Text style={styles.workTypeLabel}>Work Type</Text>
            <Text style={styles.workTypeValue}>Repair ›</Text>
          </View>
        </View>
      </ScrollView>

      {/* Stitch Fixed Bottom Action Bar */}
      <View style={styles.footer}>
        <PrimaryButton
          title={getButtonTitle()}
          onPress={handleActionPress}
          disabled={syncLoading}
          variant="blue"
          icon={<SvgActionNavigate width={18} height={18} fill="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#F8FAFC',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: spacing.md,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: spacing.sm,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  idBadgeText: {
    color: colors.stitchBlue,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerMeta: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  circleActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailsDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  workTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workTypeLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  workTypeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 16,
    ...shadows.md,
  },
});

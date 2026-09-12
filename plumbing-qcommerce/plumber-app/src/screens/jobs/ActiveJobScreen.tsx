import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ChatIcon from '../../assets/icons/chat.svg';
import MapPinIcon from '../../assets/icons/location-pin.svg';
import PhoneIcon from '../../assets/icons/phone.svg';
import { AppHeader } from '../../components/common/AppHeader';
import { JobProgressStepper } from '../../components/common/JobProgressStepper';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { setActiveJob, updateJobStatus } from '../../redux/slices/jobSlice';
import { RootState } from '../../redux/store';
import { jobService } from '../../services/jobs/jobService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { ActiveJob } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'ActiveJob'>;

export function ActiveJobScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const routeJobId = route.params?.jobId;
  const { activeJob } = useSelector((state: RootState) => state.job);

  const [syncLoading, setSyncLoading] = useState(false);
  const [loadedJob, setLoadedJob] = useState<ActiveJob | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentJobId = routeJobId || activeJob?.jobId;

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
  }, [currentJobId, activeJob?.jobId, dispatch]);

  const displayJob = activeJob && activeJob.jobId === currentJobId ? activeJob : loadedJob;

  if (!currentJobId)
    return (
      <ScreenWrapper>
        <View style={styles.empty}>
          <Text>No active job selected.</Text>
          <PrimaryButton title="Back to jobs" onPress={() => navigation.navigate('Main')} />
        </View>
      </ScreenWrapper>
    );

  if (syncLoading && !displayJob)
    return (
      <ScreenWrapper>
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
          <Text>Loading job…</Text>
        </View>
      </ScreenWrapper>
    );

  if (!displayJob)
    return (
      <ScreenWrapper>
        <View style={styles.empty}>
          <Text>{loadError || 'This job is unavailable.'}</Text>
          <PrimaryButton title="Back to jobs" onPress={() => navigation.navigate('Main')} />
        </View>
      </ScreenWrapper>
    );

  const getStepIndex = (status: string) => {
    switch (status) {
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
    Alert.alert(
      'Phone Call',
      displayJob.customer.phone
        ? `Calling customer at ${displayJob.customer.phone}`
        : 'Customer phone is unavailable.'
    );
  };

  const handleChat = () => {
    navigation.navigate('Chat', { name: displayJob.customer.fullName, role: 'Customer' });
  };

  const handleActionPress = () => {
    switch (displayJob.status) {
      case 'accepted':
        dispatch(
          updateJobStatus({
            status: 'on_the_way',
            timelineField: 'on_the_way',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })
        );
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
          latitude: displayJob.latitude,
          longitude: displayJob.longitude,
          address: displayJob.address,
        });
        break;
      case 'reached':
        navigation.navigate('StartWork', { jobId: String(displayJob.jobId) });
        break;
      case 'started':
        navigation.navigate('BeforePhotos', { jobId: String(displayJob.jobId) });
        break;
      default:
        break;
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.primary }}>
      <View style={styles.headerBar}>
        <AppHeader title="Active Job" onBackPress={() => navigation.navigate('Main')} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Job Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.jobIdText}>#{displayJob.jobId}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{displayJob.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.titleText}>{displayJob.issueDescription || 'Service job'}</Text>
          <View style={styles.addressRow}>
            <MapPinIcon width={14} height={14} stroke={colors.textMuted} />
            <Text style={styles.addressText}>{displayJob.address}</Text>
          </View>
        </View>

        {/* Customer Card */}
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>Customer</Text>
          <View style={styles.customerRow}>
            <View>
              <Text style={styles.customerName}>{displayJob.customer.fullName}</Text>
              {displayJob.customer.rating != null ? (
                <Text style={styles.customerSub}>
                  Rating: {displayJob.customer.rating.toFixed(1)} ⭐
                </Text>
              ) : null}
            </View>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <PhoneIcon width={16} height={16} stroke="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                <ChatIcon width={16} height={16} stroke={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Progress Stepper */}
        <JobProgressStepper currentStepIndex={getStepIndex(displayJob.status)} />

        {/* Job Details Card */}
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.cardSubtitle}>Job Details</Text>
          <Text style={styles.detailDescription}>
            {displayJob.customerNote || displayJob.issueDescription || 'No job description provided.'}
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Work Type</Text>
            <Text style={styles.detailVal}>Repair</Text>
          </View>
        </View>

        {/* Bottom Navigation Button */}
        <View style={styles.actionContainer}>
          <PrimaryButton
            title={displayJob.status === 'completed' ? 'Job Completed' : 'Start Navigation'}
            onPress={handleActionPress}
            disabled={displayJob.status === 'completed'}
            style={styles.navButton}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: colors.primary,
  },
  content: {
    padding: spacing.layout,
    paddingBottom: spacing.giant,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobIdText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  statusBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  titleText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  addressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  customerSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  detailVal: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
  empty: {
    flex: 1,
    padding: spacing.layout,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  navButton: {
    backgroundColor: colors.primary,
  },
});

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
import { setActiveJob, updateJobStatus } from '../../redux/slices/jobSlice';
import { jobService } from '../../services/jobs/jobService';
import PhoneIcon from '../../assets/icons/phone.svg';
import ChatIcon from '../../assets/icons/chat.svg';
import MapPinIcon from '../../assets/icons/location-pin.svg';
import NavigationIcon from '../../assets/icons/navigation.svg';

type Props = StackScreenProps<AppStackParamList, 'ActiveJob'>;

export function ActiveJobScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const routeJobId = route.params?.jobId;
  const { activeJob } = useSelector((state: RootState) => state.job);

  const [syncLoading, setSyncLoading] = useState(false);

  const currentJobId = routeJobId || activeJob?.jobId || 'JK42315';

  useEffect(() => {
    async function syncJob() {
      if (currentJobId && (!activeJob || activeJob.jobId !== String(currentJobId))) {
        setSyncLoading(true);
        try {
          const job = await jobService.fetchJobById(String(currentJobId));
          dispatch(setActiveJob(job));
        } catch (err) {
          console.error('Failed to sync job:', err);
        } finally {
          setSyncLoading(false);
        }
      }
    }
    syncJob();
  }, [currentJobId, activeJob?.jobId]);

  const displayJob = activeJob || {
    jobId: currentJobId,
    status: 'accepted',
    customer: { fullName: 'Anil Kumar', phone: '+91 98765 43210', id: 'CUST-1001', rating: 4.8 },
    address: '12, 6th Cross, Indiranagar, Bengaluru, 560038',
    latitude: 12.9716,
    longitude: 77.5946,
    issueDescription: 'Bathroom Pipe Leakage',
  };

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
    Alert.alert('Phone Call', `Calling customer at ${displayJob.customer.phone || '+91 98765 43210'}`);
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
        <AppHeader
          title="Active Job"
          onBackPress={() => navigation.navigate('Main')}
        />
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
          <Text style={styles.titleText}>{(displayJob as any).issueDescription || 'Bathroom Pipe Leakage'}</Text>
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
              <Text style={styles.customerSub}>Rating: {displayJob.customer.rating || 4.8} ⭐</Text>
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
          <Text style={styles.detailDescription}>Leakage in bathroom inlet pipe.</Text>
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
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#059669',
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
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
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
  navButton: {
    backgroundColor: colors.primary,
  },
});

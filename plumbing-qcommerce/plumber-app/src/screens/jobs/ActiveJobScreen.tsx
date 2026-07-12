import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { CustomerCard } from '../../components/cards/CustomerCard';
import { ActiveJobCard } from '../../components/cards/ActiveJobCard';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { setActiveJob, updateJobStatus } from '../../redux/slices/jobSlice';
import { jobService } from '../../services/jobs/jobService';

type Props = StackScreenProps<AppStackParamList, 'ActiveJob'>;

export function ActiveJobScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId } = route.params;
  const { activeJob } = useSelector((state: RootState) => state.job);

  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    async function syncJob() {
      if (jobId && (!activeJob || activeJob.jobId !== String(jobId))) {
        setSyncLoading(true);
        try {
          const job = await jobService.fetchJobById(String(jobId));
          dispatch(setActiveJob(job));
        } catch (err) {
          console.error('Failed to sync job:', err);
          Alert.alert('Error', 'Failed to retrieve details for Job #' + jobId);
        } finally {
          setSyncLoading(false);
        }
      }
    }
    syncJob();
  }, [jobId, activeJob?.jobId]);

  if (syncLoading && !activeJob) {
    return (
      <ScreenWrapper>
        <AppHeader title="Active Job" onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Syncing job details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!activeJob) {
    return (
      <ScreenWrapper>
        <AppHeader title="Active Job" onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active job currently.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const handleCall = () => {
    Alert.alert('Phone Call', `Calling customer at ${activeJob.customer.phone || '+91 9999999999'}`);
  };

  const handleChat = () => {
    navigation.navigate('Chat', { name: activeJob.customer.fullName, role: 'Customer' });
  };

  const handleActionPress = () => {
    // Determine target screen and actions based on job status
    switch (activeJob.status) {
      case 'accepted':
        // Update status to on_the_way and navigate to Navigation Screen
        dispatch(
          updateJobStatus({
            status: 'on_the_way',
            timelineField: 'on_the_way',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })
        );
        navigation.navigate('Navigation', {
          jobId: activeJob.jobId,
          customerId: activeJob.customer.id,
          latitude: activeJob.latitude,
          longitude: activeJob.longitude,
          address: activeJob.address,
        });
        break;
      case 'on_the_way':
        navigation.navigate('Navigation', {
          jobId: activeJob.jobId,
          customerId: activeJob.customer.id,
          latitude: activeJob.latitude,
          longitude: activeJob.longitude,
          address: activeJob.address,
        });
        break;
      case 'reached':
        navigation.navigate('StartWork', { jobId: activeJob.jobId });
        break;
      case 'started':
        // Let plumber capture photos before starting or request parts
        navigation.navigate('BeforePhotos', { jobId: activeJob.jobId });
        break;
      default:
        break;
    }
  };

  const getButtonTitle = () => {
    switch (activeJob.status) {
      case 'accepted':
        return 'Start Navigation';
      case 'on_the_way':
        return 'View Navigation Map';
      case 'reached':
        return 'Start Work';
      case 'started':
        return 'Begin Work Checklist';
      case 'completed':
        return 'Job Completed';
      default:
        return 'Continue';
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader title={`Job Details`} onBackPress={() => navigation.navigate('Main')} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.customerBlock}>
          <Text style={styles.debugText}>Job ID: {activeJob.jobId} | Status: {activeJob.status}{activeJob.jobId !== String(jobId || '') ? ` | Target: ${jobId}` : ''}</Text>
          <Text style={styles.label}>Customer details</Text>
          <CustomerCard
            name={activeJob.customer.fullName}
            rating={activeJob.customer.rating}
            onCallPress={handleCall}
            onChatPress={handleChat}
          />
        </View>

        <View style={styles.jobDetailsBlock}>
          <Text style={styles.label}>Job Description</Text>
          <View style={styles.detailCard}>
            <Text style={styles.issueText}>Bathroom Pipe Leakage</Text>
            <Text style={styles.addressText}>{activeJob.address}</Text>
            {activeJob.customerNote && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Customer Note:</Text>
                <Text style={styles.noteText}>{activeJob.customerNote}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.timelineBlock}>
          <ActiveJobCard job={activeJob} />
        </View>

        <PrimaryButton
          title={getButtonTitle()}
          onPress={handleActionPress}
          disabled={activeJob.status === 'completed'}
          style={styles.actionBtn}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  customerBlock: {
    marginBottom: spacing.lg,
  },
  jobDetailsBlock: {
    marginBottom: spacing.lg,
  },
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  detailCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  issueText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.tight,
  },
  noteBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.xs,
    marginTop: spacing.md,
  },
  noteLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  noteText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timelineBlock: {
    marginBottom: spacing.xl,
  },
  actionBtn: {
    marginTop: spacing.md,
  },
});

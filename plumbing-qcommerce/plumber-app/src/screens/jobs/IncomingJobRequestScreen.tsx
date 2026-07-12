import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { JobRequestCard } from '../../components/cards/JobRequestCard';
import { CustomerCard } from '../../components/cards/CustomerCard';
import { jobService } from '../../services/jobs/jobService';
import { setActiveJob, removeIncomingJob } from '../../redux/slices/jobSlice';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'IncomingJobRequest'>;

export function IncomingJobRequestScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId, customerId, distance } = route.params;
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto decline and exit
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDecline = () => {
    dispatch(removeIncomingJob(jobId));
    navigation.goBack();
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const activeJobDetails = await jobService.acceptJob(jobId);
      dispatch(setActiveJob(activeJobDetails));
      setLoading(false);
      
      // Clean up offer
      dispatch(removeIncomingJob(jobId));
      
      // Navigate to Active Job
      navigation.replace('ActiveJob', { jobId });
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Accept job failed', error?.message || 'Could not accept this service request. Please retry.');
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader title="New Job Request" onBackPress={handleDecline} />
      
      <View style={styles.content}>
        <View style={styles.cardWrapper}>
          <Text style={styles.debugText}>Job ID: {jobId}</Text>
          <JobRequestCard
            issueDescription="Pipe Leakage in Bathroom"
            category="Bathroom"
            address="H.No 12-5-45, Street 3, Miyapur, Hyderabad - 500049"
            distance={distance}
            earnings={299}
            timeRemaining={timer}
          />
        </View>

        <Text style={styles.sectionLabel}>Customer Information</Text>
        <View style={styles.customerCardContainer}>
          <CustomerCard
            name="Akhil Verma"
            rating={4.8}
            showActions={false}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.actionRow}>
          <SecondaryButton
            title="Decline"
            onPress={handleDecline}
            style={styles.declineBtn}
            textColor={colors.error}
          />
          <PrimaryButton
            title="Accept Job"
            onPress={handleAccept}
            loading={loading}
            style={styles.acceptBtn}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.layout,
    backgroundColor: colors.background,
  },
  cardWrapper: {
    marginBottom: spacing.xl,
  },
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  customerCardContainer: {
    marginBottom: spacing.xl,
  },
  spacer: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 'auto',
  },
  declineBtn: {
    flex: 1,
    borderColor: colors.error,
  },
  declineText: {
    color: colors.error,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: colors.success,
  },
});

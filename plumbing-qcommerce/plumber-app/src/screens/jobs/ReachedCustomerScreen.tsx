import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { jobService } from '../../services/jobs/jobService';
import { updateJobStatus } from '../../redux/slices/jobSlice';
import CheckIcon from '../../assets/icons/success-check.svg';

type Props = StackScreenProps<AppStackParamList, 'ReachedCustomer'>;

export function ReachedCustomerScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId } = route.params;
  const { activeJob } = useSelector((state: RootState) => state.job);
  const [loading, setLoading] = useState(false);

  const handleConfirmArrival = async () => {
    setLoading(true);
    try {
      await jobService.markArrived(jobId);
      dispatch(
        updateJobStatus({
          status: 'reached',
          timelineField: 'reached',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
      navigation.replace('StartWork', { jobId });
    } catch (err: any) {
      // Proceed to start work on staging fallback
      navigation.replace('StartWork', { jobId });
    } finally {
      setLoading(false);
    }
  };

  const handleContactCustomer = () => {
    const phone = activeJob?.customer.phone || '+91 98765 43210';
    Alert.alert('Contact Customer', `Calling customer at ${phone}`);
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AppHeader
        title="Reached Customer"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.body}>
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationCircle}>
            <View style={styles.pinBadge}>
              <CheckIcon width={30} height={30} stroke="#FFFFFF" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>You have reached the{'\n'}customer location</Text>
        <Text style={styles.subtitle}>Please confirm to start the service for Job #{jobId}.</Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Confirm Arrival"
          onPress={handleConfirmArrival}
          loading={loading}
          style={styles.confirmBtn}
        />
        <SecondaryButton
          title="Contact Customer"
          onPress={handleContactCustomer}
          style={styles.contactBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustrationWrap: { marginBottom: spacing.xl },
  illustrationCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  confirmBtn: {
    backgroundColor: colors.success,
  },
  contactBtn: {
    borderColor: colors.border,
  },
});

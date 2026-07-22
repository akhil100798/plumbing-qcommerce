import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { CustomerCard } from '../../components/cards/CustomerCard';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { jobService } from '../../services/jobs/jobService';
import { updateJobStatus } from '../../redux/slices/jobSlice';
import CheckIcon from '../../assets/icons/success-check.svg';
import PhoneIcon from '../../assets/icons/phone.svg';

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
      // Navigate anyway in fallback mode
      navigation.replace('StartWork', { jobId });
    } finally {
      setLoading(false);
    }
  };

  const customerName = activeJob?.customer.fullName || 'Anil Kumar';
  const customerPhone = activeJob?.customer.phone || '+91 98765 43210';

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: '#10B981' }}>
      <AppHeader
        title="Reached Customer"
        showBack={false}
      />
      
      <View style={styles.container}>
        {/* Banner Area */}
        <View style={styles.banner}>
          <View style={styles.bannerIconContainer}>
            <CheckIcon width={28} height={28} stroke="#10B981" />
          </View>
          <Text style={styles.bannerTitle}>You have reached</Text>
          <Text style={styles.bannerSubtitle}>the customer location</Text>
        </View>

        {/* Customer Address & Contact Card */}
        <View style={styles.card}>
          <Text style={styles.jobIdText}>Job #{jobId}</Text>
          <Text style={styles.addressTitle}>Location Address</Text>
          <Text style={styles.addressText}>
            {activeJob?.address || '12, 6th Cross, Indiranagar, Bengaluru, 560038'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.customerRow}>
            <View>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerPhone}>{customerPhone}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Alert.alert('Calling Customer', `Calling ${customerPhone}`)}
            >
              <PhoneIcon width={16} height={16} stroke="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />

        <PrimaryButton
          title="Confirm Arrival & Proceed"
          onPress={handleConfirmArrival}
          loading={loading}
          style={styles.actionBtn}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.layout,
    backgroundColor: colors.background,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  bannerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  bannerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: '#059669',
  },
  bannerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  jobIdText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: typography.lineHeight.tight,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  customerPhone: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  actionBtn: {
    backgroundColor: '#10B981',
  },
});

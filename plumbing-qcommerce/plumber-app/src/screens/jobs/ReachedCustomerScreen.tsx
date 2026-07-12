import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { CustomerCard } from '../../components/cards/CustomerCard';
import { MapPreview } from '../../components/maps/MapPreview';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'ReachedCustomer'>;

export function ReachedCustomerScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { activeJob } = useSelector((state: RootState) => state.job);

  const handleNext = () => {
    navigation.replace('StartWork', { jobId });
  };

  if (!activeJob) return null;

  return (
    <ScreenWrapper>
      <AppHeader title="Arrived" showBack={false} />
      
      <View style={styles.container}>
        <View style={styles.banner}>
          <View style={styles.bannerIconContainer}>
            <Text style={styles.bannerIcon}>📍</Text>
          </View>
          <Text style={styles.bannerTitle}>You have reached</Text>
          <Text style={styles.bannerSubtitle}>the customer location</Text>
        </View>

        <View style={styles.mapWrapper}>
          <MapPreview
            latitude={activeJob.latitude}
            longitude={activeJob.longitude}
            title="Customer Destination"
            height={200}
          />
        </View>

        <View style={styles.customerSection}>
          <Text style={styles.debugText}>Job ID: {jobId}</Text>
          <Text style={styles.sectionLabel}>Customer Details</Text>
          <CustomerCard
            name={activeJob.customer.fullName}
            rating={activeJob.customer.rating}
            phone={activeJob.customer.phone}
          />
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.sectionLabel}>Customer Note</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              {activeJob.customerNote || 'Water leakage behind the wash basin.'}
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <PrimaryButton
          title="I Have Arrived"
          onPress={handleNext}
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
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  bannerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bannerIcon: {
    fontSize: 20,
  },
  bannerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  bannerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  mapWrapper: {
    marginBottom: spacing.lg,
  },
  customerSection: {
    marginBottom: spacing.lg,
  },
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  noteSection: {
    marginBottom: spacing.xl,
  },
  noteCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: typography.lineHeight.tight,
  },
  spacer: {
    flex: 1,
  },
  actionBtn: {
    backgroundColor: colors.success,
  },
});

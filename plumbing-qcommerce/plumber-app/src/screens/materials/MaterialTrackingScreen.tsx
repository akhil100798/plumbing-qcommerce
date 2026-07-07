import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { MapPreview } from '../../components/maps/MapPreview';
import { setDeliveryTracking } from '../../redux/slices/materialSlice';
import { canUseDevMockFallbacks } from '../../services/mockPolicy';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'MaterialTracking'>;

export function MaterialTrackingScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId } = route.params;
  const { deliveryTracking, approvalStatus } = useSelector((state: RootState) => state.material);
  const isDelivered = approvalStatus === 'DELIVERED';
  const isDevFallback = canUseDevMockFallbacks();

  const steps = [
    { id: 'approved', label: 'Customer Approved', active: approvalStatus === 'APPROVED' || approvalStatus === 'DELIVERING' || approvalStatus === 'DELIVERED' },
    { id: 'dispatch', label: 'Dispatch Update', active: approvalStatus === 'DELIVERING' || approvalStatus === 'DELIVERED' },
    { id: 'delivered', label: 'Delivered', active: approvalStatus === 'DELIVERED' },
  ];

  useEffect(() => {
    if (isDevFallback && !deliveryTracking) {
      dispatch(
        setDeliveryTracking({
          riderName: 'Suresh Kumar',
          riderPhone: '+91 8888888888',
          riderRating: 4.7,
          eta: '11:00 AM',
        })
      );
    }
  }, [dispatch, deliveryTracking, isDevFallback]);

  const handleCallRider = () => {
    if (!deliveryTracking?.riderPhone) {
      Alert.alert('Unavailable', 'Live rider contact is not available in staging.');
      return;
    }
    Alert.alert('Calling Rider', `Calling rider ${deliveryTracking.riderName} at ${deliveryTracking.riderPhone}`);
  };

  const handleContinueWork = () => {
    if (!isDelivered) {
      Alert.alert('Waiting for delivery', 'Material delivery has not been confirmed by the staging backend yet.');
      return;
    }
    navigation.replace('ActiveJob', { jobId });
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Material Tracking" onBackPress={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapContainer}>
          <MapPreview
            latitude={17.4944}
            longitude={78.3499}
            title={deliveryTracking?.riderName ? `Rider (${deliveryTracking.riderName})` : 'Dispatch unavailable'}
            height={220}
          />
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Staging delivery status</Text>
          <Text style={styles.noticeText}>
            {deliveryTracking?.riderName
              ? 'Delivery progress is only shown when the backend reports it.'
              : 'Live material delivery tracking is not available in staging until the backend sends dispatch details.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Material Tracking</Text>
          <View style={styles.timeline}>
            {steps.map((step, index) => {
              const isDone = step.active;
              const isCurrent = isDone && (index === steps.findIndex((entry) => !entry.active) - 1 || (isDelivered && index === steps.length - 1));

              return (
                <View key={step.id} style={styles.timelineRow}>
                  <View style={styles.indicatorCol}>
                    <View style={[styles.dot, isDone && styles.dotDone, isCurrent && styles.dotCurrent]} />
                    {index < steps.length - 1 && (
                      <View style={[styles.line, steps[index + 1].active && styles.lineDone]} />
                    )}
                  </View>

                  <View style={styles.contentCol}>
                    <View style={styles.textRow}>
                      <Text style={[styles.label, isDone && styles.labelDone, isCurrent && styles.labelCurrent]}>
                        {step.label}
                      </Text>
                      <Text style={styles.time}>{step.active ? 'Live' : 'Pending'}</Text>
                    </View>
                    {index === 1 && !deliveryTracking?.riderName && (
                      <Text style={styles.subtitle}>Waiting for backend dispatch data.</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.riderCard}>
          <View style={styles.riderAvatar}>
            <Text style={styles.avatarText}>{deliveryTracking?.riderName ? 'R' : '!'}</Text>
          </View>
          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{deliveryTracking?.riderName || 'Dispatch unavailable'}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>?</Text>
              <Text style={styles.rating}>{deliveryTracking?.riderRating ?? 0}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCallRider}>
            <Text style={styles.callIcon}>??</Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          title={isDelivered ? 'Continue Job' : 'Waiting for Delivery'}
          onPress={handleContinueWork}
          disabled={!isDelivered}
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
  mapContainer: {
    marginBottom: spacing.lg,
  },
  noticeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noticeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
  },
  timeline: {
    paddingLeft: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  indicatorCol: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.borderDark,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  lineDone: {
    backgroundColor: colors.success,
  },
  contentCol: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
  },
  labelDone: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  labelCurrent: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  star: {
    fontSize: 10,
    marginRight: 4,
  },
  rating: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  callIcon: {
    fontSize: 14,
  },
  actionBtn: {
    width: '100%',
  },
});

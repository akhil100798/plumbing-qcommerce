import React, { useEffect, useState } from 'react';
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
import { updateApprovalStatus, setDeliveryTracking } from '../../redux/slices/materialSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'MaterialTracking'>;

export function MaterialTrackingScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId, productOrderId } = route.params;
  const { deliveryTracking, approvalStatus } = useSelector((state: RootState) => state.material);

  const [stepIndex, setStepIndex] = useState(3); // Mocking step index (0-4)

  const steps = [
    { id: 'confirmed', label: 'Order Confirmed', time: '10:30 AM' },
    { id: 'accepted', label: 'Store Accepted', time: '10:32 AM' },
    { id: 'packing', label: 'Packing Materials', time: '10:35 AM' },
    { id: 'shipping', label: 'Out for Delivery', time: '10:45 AM', subtitle: 'Rider: Suresh' },
    { id: 'arriving', label: 'Arriving Soon', time: '11:00 AM', subtitle: '2 mins away' },
  ];

  useEffect(() => {
    // Fill tracking data in Redux
    dispatch(
      setDeliveryTracking({
        riderName: 'Suresh Kumar',
        riderPhone: '+91 8888888888',
        riderRating: 4.7,
        eta: '11:00 AM',
      })
    );

    // Auto advance simulation step
    const interval = setTimeout(() => {
      setStepIndex(4);
      dispatch(updateApprovalStatus('DELIVERED'));
    }, 4000);

    return () => clearTimeout(interval);
  }, [dispatch]);

  const handleCallRider = () => {
    Alert.alert('Calling Rider', `Calling rider Suresh Kumar at ${deliveryTracking?.riderPhone}`);
  };

  const handleContinueWork = () => {
    // Redux transition back to active job screen with parts arrived
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
            title="Rider (Suresh)"
            height={220}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Material Tracking</Text>
          
          <View style={styles.timeline}>
            {steps.map((step, index) => {
              const isDone = index <= stepIndex;
              const isCurrent = index === stepIndex;

              return (
                <View key={step.id} style={styles.timelineRow}>
                  <View style={styles.indicatorCol}>
                    <View
                      style={[
                        styles.dot,
                        isDone && styles.dotDone,
                        isCurrent && styles.dotCurrent,
                      ]}
                    />
                    {index < steps.length - 1 && (
                      <View
                        style={[
                          styles.line,
                          index < stepIndex && styles.lineDone,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.contentCol}>
                    <View style={styles.textRow}>
                      <Text
                        style={[
                          styles.label,
                          isDone && styles.labelDone,
                          isCurrent && styles.labelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                      <Text style={styles.time}>{step.time}</Text>
                    </View>
                    {step.subtitle && (
                      <Text style={styles.subtitle}>{step.subtitle}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Rider Info Card */}
        <View style={styles.riderCard}>
          <View style={styles.riderAvatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{deliveryTracking?.riderName || 'Suresh'}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.rating}>{deliveryTracking?.riderRating ?? 4.7}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCallRider}>
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          title={stepIndex === 4 ? 'Continue Job' : 'Simulate Delivery Arrived'}
          onPress={handleContinueWork}
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

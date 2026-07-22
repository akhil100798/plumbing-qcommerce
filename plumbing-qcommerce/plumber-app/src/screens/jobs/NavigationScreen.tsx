import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { RouteMap } from '../../components/maps/RouteMap';
import { updateJobStatus } from '../../redux/slices/jobSlice';
import { canUseDevMockFallbacks } from '../../services/mockPolicy';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { jobService } from '../../services/jobs/jobService';
import NavigationIcon from '../../assets/icons/navigation.svg';
import MapPinIcon from '../../assets/icons/location-pin.svg';

type Props = StackScreenProps<AppStackParamList, 'Navigation'>;

export function NavigationScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId, address, latitude, longitude } = route.params;
  const { activeJob } = useSelector((state: RootState) => state.job);
  const [loading, setLoading] = useState(false);

  const handleReached = async () => {
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
      navigation.replace('ReachedCustomer', { jobId });
    } catch (err: any) {
      Alert.alert('Arrival failed', err?.message || 'Could not mark this job as arrived. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: '#10B981' }}>
      <AppHeader
        title="Navigating to Customer"
        onBackPress={() => navigation.goBack()}
      />

      {/* Turn Instruction Header Banner */}
      <View style={styles.banner}>
        <NavigationIcon width={24} height={24} stroke="#FFFFFF" />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerDistance}>1.2 km away</Text>
          <Text style={styles.bannerInstruction}>Turn Right on 6th Cross, Indiranagar</Text>
        </View>
      </View>

      <View style={styles.container}>
        <RouteMap
          plumberLatitude={latitude}
          plumberLongitude={longitude}
          customerLatitude={latitude}
          customerLongitude={longitude}
          customerName={activeJob?.customer.fullName || 'Customer'}
        />

        {/* Bottom ETA & Action Panel */}
        <View style={styles.bottomCard}>
          <View style={styles.etaRow}>
            <View style={styles.etaBadge}>
              <Text style={styles.etaTime}>12 mins</Text>
              <Text style={styles.etaLabel}>ETA</Text>
            </View>
            <View style={styles.destInfo}>
              <Text style={styles.jobIdText}>Job #{jobId}</Text>
              <Text style={styles.customerNameText}>{activeJob?.customer.fullName || 'Customer'}</Text>
            </View>
          </View>

          <Text style={styles.addressTitle}>Customer Address</Text>
          <Text style={styles.addressContent}>{address}</Text>

          <PrimaryButton 
            title="I Have Arrived" 
            onPress={handleReached} 
            loading={loading}
            style={styles.arriveBtn} 
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerDistance: {
    fontSize: typography.fontSize.xs,
    color: '#D1FAE5',
    fontWeight: typography.fontWeight.bold,
  },
  bannerInstruction: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
  },
  container: { flex: 1, position: 'relative' },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.lg,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  etaBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  etaTime: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  etaLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  destInfo: {
    flex: 1,
  },
  jobIdText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  customerNameText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addressTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  addressContent: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.tight,
    marginBottom: spacing.lg,
  },
  arriveBtn: {
    width: '100%',
    backgroundColor: '#10B981',
  },
});

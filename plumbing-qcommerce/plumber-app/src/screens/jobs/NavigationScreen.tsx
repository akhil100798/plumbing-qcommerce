import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { RouteMap } from '../../components/maps/RouteMap';
import { updateJobStatus } from '../../redux/slices/jobSlice';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'Navigation'>;

export function NavigationScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { customerId, address, latitude, longitude } = route.params;
  const { activeJob } = useSelector((state: RootState) => state.job);

  const handleReached = () => {
    // Transition status to Reached
    dispatch(
      updateJobStatus({
        status: 'reached',
        timelineField: 'reached',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    );
    // Navigate to Reached Customer Screen
    navigation.replace('ReachedCustomer', { jobId: activeJob?.jobId || 'PC123456' });
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Navigate" onBackPress={() => navigation.goBack()} />
      
      <View style={styles.container}>
        <RouteMap
          plumberLatitude={17.4856} // Simulated current plumber location
          plumberLongitude={78.3374}
          customerLatitude={latitude}
          customerLongitude={longitude}
          customerName={activeJob?.customer.fullName || 'Customer'}
        />

        {/* Bottom Details Card Overlay */}
        <View style={styles.bottomCard}>
          <View style={styles.etaRow}>
            <View style={styles.etaBlock}>
              <Text style={styles.etaText}>12 mins</Text>
              <Text style={styles.distanceText}>2.4 km away</Text>
            </View>
            <View style={styles.markerContainer}>
              <Text style={styles.markerIcon}>🗺️</Text>
            </View>
          </View>

          <Text style={styles.addressTitle}>Destination Address</Text>
          <Text style={styles.addressContent}>{address}</Text>

          <PrimaryButton
            title="I Have Arrived"
            onPress={handleReached}
            style={styles.arriveBtn}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
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
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  etaBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  etaText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  distanceText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  markerIcon: {
    fontSize: 16,
  },
  addressTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressContent: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.tight,
    marginBottom: spacing.lg,
  },
  arriveBtn: {
    width: '100%',
    backgroundColor: colors.success,
  },
});

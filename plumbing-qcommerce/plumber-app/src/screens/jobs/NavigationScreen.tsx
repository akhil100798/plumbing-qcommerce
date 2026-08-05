import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { RouteMap } from '../../components/maps/RouteMap';
import { updateJobStatus } from '../../redux/slices/jobSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { jobService } from '../../services/jobs/jobService';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';
import NavigationIcon from '../../assets/icons/navigation.svg';
import PhoneIcon from '../../assets/icons/phone.svg';
import LocationPinIcon from '../../assets/icons/location-pin.svg';

type Props = StackScreenProps<AppStackParamList, 'Navigation'>;

export function NavigationScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId, address, latitude, longitude } = route.params;
  const { activeJob } = useSelector((state: RootState) => state.job);
  const [loading, setLoading] = useState(false);

  const handleEndTrip = async () => {
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
      Alert.alert('Arrival failed', err?.message || 'Could not mark this job as arrived. Proceeding to arrival confirmation.');
      navigation.replace('ReachedCustomer', { jobId });
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    const phone = activeJob?.customer.phone || '+91 98765 43210';
    Alert.alert('Contact Customer', `Calling customer at ${phone}`);
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AppHeader title="Navigation" onBackPress={() => navigation.goBack()} />

      <View style={styles.mapArea}>
        {/* Map View */}
        <RouteMap
          plumberLatitude={latitude}
          plumberLongitude={longitude}
          customerLatitude={latitude}
          customerLongitude={longitude}
          customerName={activeJob?.customer.fullName || 'Customer'}
        />

        {/* Floating Turn Instruction Banner */}
        <View style={styles.turnBanner}>
          <View style={styles.turnIcon}>
            <ArrowRightIcon width={22} height={22} stroke="#FFFFFF" />
          </View>
          <View style={styles.turnTextWrap}>
            <Text style={styles.turnDistance}>350 m</Text>
            <Text style={styles.turnDesc}>Turn right{'\n'}100 Feet Road</Text>
          </View>
          <TouchableOpacity style={styles.recenterBtn}>
            <LocationPinIcon width={16} height={16} stroke={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Floating Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => Alert.alert('Recenter', 'Map centered on live position.')}>
            <NavigationIcon width={16} height={16} stroke={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={handleCall}>
            <PhoneIcon width={16} height={16} stroke={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Trip Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.eta}>12 min</Text>
          <Text style={styles.etaSub}>4.3 km · Job #{jobId}</Text>
        </View>
        <TouchableOpacity
          style={styles.endTripBtn}
          onPress={handleEndTrip}
          disabled={loading}
        >
          <Text style={styles.endTripLabel}>{loading ? 'Arriving...' : 'End Trip'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  mapArea: { flex: 1, position: 'relative' },
  turnBanner: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    ...shadows.md,
  },
  turnIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  turnTextWrap: { flex: 1 },
  turnDistance: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, color: '#FFFFFF' },
  turnDesc: { fontSize: typography.fontSize.xs, color: '#FFFFFF', opacity: 0.9, marginTop: 2 },
  recenterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapControls: {
    position: 'absolute',
    right: spacing.lg,
    top: 90,
    gap: spacing.xs,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerLeft: {},
  eta: { fontSize: 24, fontWeight: typography.fontWeight.black, color: colors.textPrimary },
  etaSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  endTripBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  endTripLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: '#EF4444' },
});

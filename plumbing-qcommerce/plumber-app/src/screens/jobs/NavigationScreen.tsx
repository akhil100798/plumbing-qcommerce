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
  const params = (route?.params || {}) as any;
  const jobId = params.jobId || 'JOB-1024';
  const latitude = params.latitude;
  const longitude = params.longitude;
  const plumberLatitude = params.plumberLatitude;
  const plumberLongitude = params.plumberLongitude;
  const routeEta = params.routeEta;
  const routeDistance = params.routeDistance;
  const turnInstruction = params.turnInstruction;
  const turnDistance = params.turnDistance;
  const hasRenderableMap = plumberLatitude != null && plumberLongitude != null && latitude != null && longitude != null;
  const { activeJob } = useSelector((state: RootState) => state.job);
  const [loading, setLoading] = useState(false);

  const handleEndTrip = async () => {
    setLoading(true);
    try {
      await jobService.markArrived(jobId);
      if (typeof (jobService as any).startWork === 'function') {
        try {
          await (jobService as any).startWork(jobId);
        } catch (e) {
          console.warn('startWork in handleEndTrip:', e);
        }
      }
      dispatch(
        updateJobStatus({
          status: 'started',
          timelineField: 'started',
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

  const handleCall = () => {
    const phone = activeJob?.customer.phone;
    if (!phone) return;
    Alert.alert('Contact Customer', `Calling customer at ${phone}`);
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AppHeader
        title="Navigation"
        variant="green"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.mapArea}>
        {/* Map View */}
        {hasRenderableMap ? (
          <RouteMap
            plumberLatitude={plumberLatitude}
            plumberLongitude={plumberLongitude}
            customerLatitude={latitude}
            customerLongitude={longitude}
            customerName={activeJob?.customer.fullName || 'Customer unavailable'}
          />
        ) : (
          <View style={styles.mapUnavailable}>
            <Text style={styles.mapUnavailableText}>Map coordinates unavailable</Text>
          </View>
        )}

        {/* Stitch Floating Turn Instruction Banner */}
        {turnInstruction && turnDistance ? (
          <View style={styles.turnBanner}>
            <View style={styles.turnIconWrap}>
              <ArrowRightIcon width={22} height={22} stroke="#FFFFFF" />
            </View>
            <View style={styles.turnTextWrap}>
              <Text style={styles.turnDistanceText}>{turnDistance}</Text>
              <Text style={styles.turnInstructionText}>{turnInstruction}</Text>
            </View>
            {hasRenderableMap ? (
              <TouchableOpacity
                style={styles.recenterBtn}
                onPress={() => Alert.alert('Recenter', 'Map centered on live position.')}
                accessibilityLabel="Recenter location"
              >
                <LocationPinIcon width={16} height={16} stroke={colors.textPrimary} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Stitch Floating Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlBtn}
            disabled={!hasRenderableMap}
            onPress={() => {
              if (!hasRenderableMap) return;
              Alert.alert('Recenter', 'Map centered on live position.');
            }}
            accessibilityLabel="Re-center location"
          >
            <NavigationIcon width={18} height={18} stroke={hasRenderableMap ? colors.stitchGreen : '#94A3B8'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleCall}
            disabled={!activeJob?.customer.phone}
            accessibilityLabel="Call Customer"
          >
            <PhoneIcon width={18} height={18} stroke={activeJob?.customer.phone ? '#1E293B' : '#CBD5E1'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stitch Trip Stats Dock */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.etaRow}>
            <Text style={styles.etaNumber}>{routeEta || 'ETA unavailable'}</Text>
          </View>
          <Text style={styles.etaSubtitle}>
            {routeDistance || 'Distance unavailable'} • Job #{jobId}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
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
  flex: {
    flex: 1,
    backgroundColor: '#EEF1F5',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  mapUnavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF1F5',
  },
  mapUnavailableText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  turnBanner: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: colors.stitchGreen,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    ...shadows.md,
    zIndex: 30,
  },
  turnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  turnTextWrap: {
    flex: 1,
  },
  turnDistanceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  turnInstructionText: {
    fontSize: 13,
    color: '#ECFDF5',
    fontWeight: '600',
    marginTop: 2,
  },
  recenterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 96,
    gap: 10,
    zIndex: 25,
  },
  controlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    ...shadows.lg,
  },
  footerLeft: {
    flex: 1,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  etaNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  etaSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 3,
  },
  endTripBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    ...shadows.sm,
  },
  endTripLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

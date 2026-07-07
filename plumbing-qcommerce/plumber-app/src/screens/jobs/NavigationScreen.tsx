import React from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { RouteMap } from '../../components/maps/RouteMap';
import { updateJobStatus } from '../../redux/slices/jobSlice';
import { canUseDevMockFallbacks } from '../../services/mockPolicy';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'Navigation'>;

export function NavigationScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { address, latitude, longitude } = route.params;
  const { activeJob } = useSelector((state: RootState) => state.job);
  const devMode = canUseDevMockFallbacks();

  const handleReached = () => {
    if (!devMode) {
      Alert.alert('Feature unavailable', 'Live arrival confirmation is not available in staging.');
      return;
    }

    dispatch(updateJobStatus({ status: 'reached', timelineField: 'reached', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
    navigation.replace('ReachedCustomer', { jobId: activeJob?.jobId || 'PC123456' });
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Navigate" onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <RouteMap
          plumberLatitude={latitude}
          plumberLongitude={longitude}
          customerLatitude={latitude}
          customerLongitude={longitude}
          customerName={activeJob?.customer.fullName || 'Customer'}
        />

        <View style={styles.bottomCard}>
          {!devMode && <Text style={styles.noticeText}>Live GPS routing and arrival confirmation remain unavailable in staging.</Text>}
          <View style={styles.etaRow}>
            <View style={styles.etaBlock}>
              <Text style={styles.etaText}>Backend pending</Text>
              <Text style={styles.distanceText}>Await live location support</Text>
            </View>
            <View style={styles.markerContainer}><Text style={styles.markerIcon}>???</Text></View>
          </View>

          <Text style={styles.addressTitle}>Destination Address</Text>
          <Text style={styles.addressContent}>{address}</Text>

          <PrimaryButton title={devMode ? 'I Have Arrived' : 'Arrival unavailable in staging'} onPress={handleReached} style={styles.arriveBtn} />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.border },
  noticeText: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.md },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  etaBlock: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  etaText: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, color: colors.primary },
  distanceText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  markerContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  markerIcon: { fontSize: 16 },
  addressTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  addressContent: { fontSize: typography.fontSize.sm, color: colors.textPrimary, lineHeight: typography.lineHeight.tight, marginBottom: spacing.lg },
  arriveBtn: { width: '100%', backgroundColor: colors.success },
});

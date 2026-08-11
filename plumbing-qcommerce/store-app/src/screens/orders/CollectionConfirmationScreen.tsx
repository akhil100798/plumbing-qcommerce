import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { MaterialRequest } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'CollectionConfirmation' | any>;

export function CollectionConfirmationScreen({ route, navigation }: Props) {
  const requestId = (route.params as any)?.requestId || (route.params as any)?.orderId;
  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      const data = await materialRequestService.getById(Number(requestId));
      setRequest(data);
    } catch {
      // fetch fail
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleConfirmHandover = async () => {
    if (!request) return;

    if (request.status !== 'PLUMBER_AT_STORE' && request.status !== 'READY_FOR_PICKUP') {
      Alert.alert('Cannot Confirm', 'Plumber must record collection before store confirms handover.');
      return;
    }

    setConfirming(true);
    try {
      const updated = await materialRequestService.confirmCollection(Number(request.id));
      setRequest(updated);
      Alert.alert(
        'Handover Confirmed! ✓',
        'You have confirmed material handover to the plumber. Inventory has been updated.',
        [{ text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'MaterialsTab' } as any) }]
      );
    } catch (err: any) {
      Alert.alert('Confirmation Failed', err?.message || 'Unable to confirm collection.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching Handover Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCollected = request?.status === 'COLLECTED';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'MaterialsTab' } as any);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Handover</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Handover summary card */}
        <View style={styles.card}>
          <View style={styles.iconHeaderRow}>
            <WarehouseIcon width={36} height={36} stroke={colors.primaryContainer || colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.cardTitle}>Material Request #{request?.id || requestId}</Text>
              <Text style={styles.cardSubtitle}>Service Order: #{request?.serviceOrderId || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plumber Name</Text>
            <Text style={styles.infoValBold}>{request?.plumberName || 'Field Technician'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Value</Text>
            <Text style={styles.infoValBold}>₹{(request?.totalAmount || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Items to Hand Over */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items to Hand Over</Text>
          {(request?.items || []).map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemQty}>{item.quantity} Units</Text>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.actions}>
          {!isCollected ? (
            <TouchableOpacity
              style={[styles.confirmBtn, confirming && styles.disabledBtn]}
              onPress={handleConfirmHandover}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Handover & Finalize Stock</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.successBanner}>
              <SuccessCheckIcon width={24} height={24} stroke={colors.secondary || '#1B6D24'} />
              <Text style={styles.successBannerText}>Handover Confirmed — Request Completed ✓</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  scrollBody: { padding: spacing.layout, paddingBottom: spacing.giant },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  iconHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  cardSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  infoLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  infoValBold: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  itemName: { fontSize: typography.fontSize.xs, color: colors.textPrimary, fontWeight: typography.fontWeight.bold },
  itemQty: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  actions: { marginTop: spacing.xs },
  confirmBtn: {
    backgroundColor: colors.secondary || '#1B6D24',
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  disabledBtn: { opacity: 0.6 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight || '#E7F7EC',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  successBannerText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.secondary || '#1B6D24' },
});

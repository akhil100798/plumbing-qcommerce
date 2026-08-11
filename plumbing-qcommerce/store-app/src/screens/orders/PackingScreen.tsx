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
import { materialRequestService } from '../../services/orders/materialRequestService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { MaterialRequest } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Packing' | any>;

export function PackingScreen({ route, navigation }: Props) {
  const requestId = (route.params as any)?.requestId || (route.params as any)?.orderId;
  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const loadRequest = useCallback(async () => {
    try {
      const data = await materialRequestService.getById(Number(requestId));
      setRequest(data);
      // Restore checklist state from server-persisted packed quantities
      const initialChecked: Record<number, boolean> = {};
      (data.items || []).forEach((item, idx) => {
        if ((item.packedQuantity || 0) >= item.quantity) {
          initialChecked[idx] = true;
        }
      });
      setCheckedItems(initialChecked);
    } catch {
      // transient fail handled
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const toggleCheck = async (index: number) => {
    if (!request || !request.items || !request.items[index]) return;
    const newChecked = !checkedItems[index];
    const nextState = { ...checkedItems, [index]: newChecked };
    setCheckedItems(nextState);

    // Build map of product ID to packed quantity
    const packedQuantities: Record<number, number> = {};
    request.items.forEach((item, idx) => {
      const isPacked = nextState[idx];
      packedQuantities[item.productId] = isPacked ? item.quantity : 0;
    });

    try {
      const updated = await materialRequestService.updatePackingProgress(Number(request.id), packedQuantities);
      setRequest(updated);
    } catch (err: any) {
      // Revert local state on network error
      setCheckedItems(checkedItems);
    }
  };

  const handleStartPreparing = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const updated = await materialRequestService.prepareOrder(Number(request.id));
      setRequest(updated);
      Alert.alert('Preparation Started', 'Items are now marked as being prepared/packed.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not start preparation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const updated = await materialRequestService.completePreparation(Number(request.id));
      setRequest(updated);
      Alert.alert('Ready for Pickup!', 'Material request is now ready for plumber self-pickup.');
      navigation.navigate('ReadyForPickup', { requestId: Number(request.id) } as any);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not mark ready for pickup.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching Checklist Items from Server...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = request?.items || [];
  const isPreparing = request?.status === 'PREPARING';
  const isReady = request?.status === 'READY_FOR_PICKUP' || request?.status === 'READY';

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
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Preparation Checklist</Text>
          <Text style={styles.headerSubtitle}>Request #{request?.id || requestId}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Hardware item checklist */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Requested Hardware Items (Server-Persisted)</Text>
          {items.map((item, idx) => {
            const isChecked = !!checkedItems[idx];
            return (
              <TouchableOpacity key={idx} style={styles.itemCheckRow} onPress={() => toggleCheck(idx)}>
                <View style={[styles.checkBox, isChecked && styles.checkBoxDone]}>
                  {isChecked && <SuccessCheckIcon width={14} height={14} stroke="#FFFFFF" />}
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[styles.itemName, isChecked && styles.itemNameDone]}>{item.productName}</Text>
                  <Text style={styles.itemMeta}>Product ID: #{item.productId}</Text>
                </View>
                <Text style={styles.itemQty}>{item.quantity} Units</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Controls */}
        <View style={styles.actions}>
          {request?.status === 'STORE_ACCEPTED' && (
            <TouchableOpacity
              style={[styles.primaryButton, actionLoading && styles.disabledBtn]}
              onPress={handleStartPreparing}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Start Item Preparation</Text>
              )}
            </TouchableOpacity>
          )}

          {(isPreparing || request?.status === 'STORE_ACCEPTED' || request?.status === 'PENDING') && (
            <TouchableOpacity
              style={[styles.readyButton, actionLoading && styles.disabledBtn]}
              onPress={handleMarkReady}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.readyButtonText}>Mark Ready for Plumber Pickup</Text>
              )}
            </TouchableOpacity>
          )}

          {isReady && (
            <View style={styles.readyBanner}>
              <Text style={styles.readyBannerText}>✓ Request is Ready for Plumber Self-Pickup</Text>
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
  headerSubtitle: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
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
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  itemCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border || '#C6C5D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    backgroundColor: colors.secondary || '#1B6D24',
    borderColor: colors.secondary || '#1B6D24',
  },
  itemName: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  itemNameDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  itemMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  itemQty: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  actions: { gap: spacing.md },
  primaryButton: {
    backgroundColor: colors.primaryContainer || colors.primary,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  readyButton: {
    backgroundColor: colors.secondary || '#1B6D24',
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyButtonText: { color: '#FFFFFF', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  disabledBtn: { opacity: 0.6 },
  readyBanner: {
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
  },
  readyBannerText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.secondary || '#1B6D24' },
});

export default PackingScreen;

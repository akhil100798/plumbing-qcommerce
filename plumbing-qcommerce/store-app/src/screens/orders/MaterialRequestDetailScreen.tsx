import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AppStackParamList } from '../../types/navigation';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { MaterialRequest } from '../../types';
import { StoreIcon } from '../../components/common/StoreIcon';
import { colors, borderRadius, spacing, typography } from '../../theme';

type Props = StackScreenProps<AppStackParamList, 'MaterialRequestDetail'>;

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; borderColor: string }> = {
  PENDING: { label: 'Requested', color: '#D97706', bg: '#FEF3C7', borderColor: '#FDE68A' },
  PREPARING: { label: 'Being Prepared', color: '#0284C7', bg: '#E0F2FE', borderColor: '#BAE6FD' },
  READY: { label: 'Ready for Counter Pickup', color: '#059669', bg: '#ECFDF5', borderColor: '#A7F3D0' },
  COMPLETED: { label: 'Collected by Plumber', color: '#4B5563', bg: '#F3F4F6', borderColor: '#E5E7EB' },
  CANCELLED: { label: 'Cancelled', color: colors.error, bg: '#FEF2F2', borderColor: '#FEE2E2' },
};

export function MaterialRequestDetailScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequest = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      setError(null);
      try {
        const req = await materialRequestService.getById(requestId);
        setRequest(req);
      } catch (err: any) {
        if (isInitial) setError(err.message || 'Unable to load material request. Please try again.');
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [requestId]
  );

  useEffect(() => {
    loadRequest(true);
    const interval = setInterval(() => {
      if (!actionLoading) {
        void loadRequest(false);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [loadRequest, actionLoading]);

  const handlePrepare = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const updated = await materialRequestService.prepareOrder(request.id as number);
      setRequest(updated);
      Alert.alert('Preparation Started', 'Materials are now marked as preparing for counter pickup.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not start preparation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReady = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const updated = await materialRequestService.completePreparation(request.id as number);
      setRequest(updated);
      Alert.alert(
        'Ready for Pickup',
        'Store has confirmed items are packed and ready at counter for plumber.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not mark as ready.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCollection = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const updated = await materialRequestService.confirmCollection(request.id as number);
      setRequest(updated);
      Alert.alert(
        'Collection Confirmed',
        'Plumber has verified and collected all requested materials.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not confirm collection.');
    } finally {
      setActionLoading(false);
    }
  };

  const rawStatus = (request as any)?.rawStatus || '';
  const canPrepare =
    rawStatus === 'REQUESTED' ||
    rawStatus === 'STORE_REVIEWING' ||
    rawStatus === 'APPROVED' ||
    rawStatus === 'PARTIALLY_AVAILABLE' ||
    request?.status === 'PENDING';
  const canReady =
    rawStatus === 'RESERVED' || rawStatus === 'PREPARING' || request?.status === 'PREPARING';
  const canConfirm =
    rawStatus === 'READY_FOR_PICKUP' ||
    rawStatus === 'PLUMBER_AT_STORE' ||
    request?.status === 'READY';

  const statusConfig = STATUS_LABELS[request?.status || 'PENDING'] || STATUS_LABELS.PENDING;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('MaterialRequests');
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Material Request #{requestId}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading request details...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <StoreIcon name="warning" size={40} color={colors.error} />
          <Text style={styles.errorTitle}>Could Not Load Request</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadRequest(true)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : request ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Header Card */}
          <View style={styles.statusCard}>
            <View style={styles.idRow}>
              <View>
                <Text style={styles.requestSubtitle}>COUNTER PICKUP REQUEST</Text>
                <Text style={styles.requestIdText}>REQ-{request.id}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusConfig.bg, borderColor: statusConfig.borderColor },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Service Order</Text>
                <Text style={styles.metaVal}>#{request.serviceOrderId}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Date Requested</Text>
                <Text style={styles.metaVal}>
                  {new Date(request.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Store Node</Text>
                <Text style={styles.metaVal}>Store #{request.storeId}</Text>
              </View>
            </View>
          </View>

          {/* Assigned Plumber Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <StoreIcon name="plumber" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Assigned Plumber</Text>
            </View>
            <View style={styles.plumberDetailRow}>
              <View style={styles.plumberAvatar}>
                <StoreIcon name="plumber" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.plumberName}>
                  {request.plumberName || 'Assigned Technician'}
                </Text>
                <Text style={styles.plumberSubtitle}>
                  Authorized to inspect & pick up materials at store counter
                </Text>
              </View>
            </View>
          </View>

          {/* Material Items Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <StoreIcon name="package" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Requested Items Breakdown</Text>
            </View>

            {(request.items || []).map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemIconBox}>
                  <StoreIcon name="plumbing-fitting" size={20} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemSubText}>Verified in counter stock</Text>
                </View>
                <View style={styles.itemQtyBox}>
                  <Text style={styles.itemQtyVal}>{item.quantity} pcs</Text>
                </View>
              </View>
            ))}

            {request.items?.length === 0 && (
              <Text style={styles.emptyItems}>No item lines available.</Text>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Estimated Value</Text>
              <Text style={styles.totalValue}>
                ₹{request.totalAmount ? request.totalAmount.toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>

          {/* Fulfillment Instructions */}
          <View style={styles.instructionsBox}>
            <StoreIcon name="store" size={18} color={colors.primary} />
            <Text style={styles.instructionsText}>
              Pack and place items on the counter pickup shelf. Verify plumber identity before handing over materials.
            </Text>
          </View>

          {/* Status-Driven Workflow Action Buttons */}
          <View style={styles.actionContainer}>
            {canPrepare && (
              <TouchableOpacity
                testID="store-start-prep-btn"
                accessibilityRole="button"
                style={[styles.actionBtn, styles.actionBtnPrimary, actionLoading && styles.actionBtnDisabled]}
                onPress={handlePrepare}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <StoreIcon name="packing" size={18} color={colors.surface} />
                    <Text style={styles.actionBtnText}>Start Preparation</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canReady && (
              <TouchableOpacity
                testID="store-ready-pickup-btn"
                accessibilityRole="button"
                style={[styles.actionBtn, styles.actionBtnSuccess, actionLoading && styles.actionBtnDisabled]}
                onPress={handleReady}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <StoreIcon name="success" size={18} color={colors.surface} />
                    <Text style={styles.actionBtnText}>Mark Ready for Pickup</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canConfirm && (
              <TouchableOpacity
                testID="store-confirm-collected-btn"
                accessibilityRole="button"
                style={[styles.actionBtn, styles.actionBtnSuccess, actionLoading && styles.actionBtnDisabled]}
                onPress={handleConfirmCollection}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <StoreIcon name="success" size={18} color={colors.surface} />
                    <Text style={styles.actionBtnText}>Confirm Plumber Collected</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {request.status === 'COMPLETED' && (
              <View style={styles.completedBanner}>
                <StoreIcon name="success" size={20} color="#059669" />
                <Text style={styles.completedBannerText}>
                  Materials Collected by Plumber · Request Complete
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 280,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  errorMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  retryBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  requestIdText: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaGrid: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  plumberDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plumberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  plumberName: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  plumberSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemQtyBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.sm,
  },
  itemQtyVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyItems: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  actionContainer: {
    gap: 12,
  },
  actionBtn: {
    height: 50,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnSuccess: {
    backgroundColor: '#059669',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  completedBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});

export default MaterialRequestDetailScreen;

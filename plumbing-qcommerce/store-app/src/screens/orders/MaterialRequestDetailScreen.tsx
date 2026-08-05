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
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';

type Props = StackScreenProps<AppStackParamList, 'MaterialRequestDetail'>;

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'Pending Review',    color: colors.accentOrange,     bg: colors.accentOrangeLight },
  PREPARING:  { label: 'Being Prepared',    color: '#2E9AE0',               bg: '#E7F5FE' },
  READY:      { label: 'Ready for Pickup',  color: colors.accentGreen,      bg: colors.accentGreenLight },
  COMPLETED:  { label: 'Collected',         color: '#6B7280',               bg: '#F3F4F6' },
  CANCELLED:  { label: 'Cancelled',         color: colors.error,            bg: colors.errorLight || '#FEE2E2' },
};

export function MaterialRequestDetailScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const req = await materialRequestService.getById(requestId);
      setRequest(req);
    } catch (err: any) {
      setError(err.message || 'Unable to load material request. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handlePrepare = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const updated = await materialRequestService.prepareOrder(request.id as number);
      setRequest(updated);
      Alert.alert('Preparation Started', 'Materials are now being prepared for plumber pickup.');
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
      Alert.alert('Ready for Pickup', 'Store has confirmed materials are packed and ready for plumber pickup.');
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
      Alert.alert('Collection Confirmed', 'Plumber has collected all materials. Request complete.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not confirm collection.');
    } finally {
      setActionLoading(false);
    }
  };

  const rawStatus = (request as any)?.rawStatus || '';
  const canPrepare  = rawStatus === 'REQUESTED' || rawStatus === 'STORE_REVIEWING' || rawStatus === 'APPROVED' || rawStatus === 'PARTIALLY_AVAILABLE';
  const canReady    = rawStatus === 'RESERVED' || rawStatus === 'PREPARING';
  const canConfirm  = rawStatus === 'READY_FOR_PICKUP' || rawStatus === 'PLUMBER_AT_STORE';

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
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Material Request
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading request…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could Not Load Request</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRequest}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : request ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Request ID & status */}
          <View style={styles.idRow}>
            <Text style={styles.requestId}>Request #{request.id}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Meta card */}
          <View style={styles.card}>
            <Row label="Service Order" value={`#${request.serviceOrderId}`} />
            <Row label="Assigned Plumber" value={request.plumberName || 'Plumber Assigned'} />
            <Row label="Store ID" value={`${request.storeId}`} />
            <Row label="Requested On" value={new Date(request.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric'
            })} />
            {(request as any).rawStatus && (
              <Row label="Backend Status" value={(request as any).rawStatus} />
            )}
          </View>

          {/* Product rows */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Requested Materials</Text>
            {(request.items || []).map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                </View>
                <View style={styles.itemQtyBlock}>
                  <Text style={styles.itemQtyLabel}>Requested</Text>
                  <Text style={styles.itemQtyVal}>{item.quantity}</Text>
                </View>
              </View>
            ))}
            {request.items?.length === 0 && (
              <Text style={styles.emptyItems}>No item details available.</Text>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{request.totalAmount?.toFixed(2)}</Text>
            </View>
          </View>

          {/* Workflow actions */}
          <View style={styles.actions}>
            {canPrepare && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary, actionLoading && styles.actionBtnDisabled]}
                onPress={handlePrepare}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.actionBtnText}>Start Preparation</Text>
                )}
              </TouchableOpacity>
            )}
            {canReady && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSuccess, actionLoading && styles.actionBtnDisabled]}
                onPress={handleReady}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.actionBtnText}>Mark Ready for Pickup</Text>
                )}
              </TouchableOpacity>
            )}
            {canConfirm && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSuccess, actionLoading && styles.actionBtnDisabled]}
                onPress={handleConfirmCollection}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.actionBtnText}>Confirm Plumber Collected</Text>
                )}
              </TouchableOpacity>
            )}
            {request.status === 'COMPLETED' && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedText}>✓ Plumber Collected — Request Complete</Text>
              </View>
            )}
          </View>

        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.layout,
  },
  loadingText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  errorIcon: { fontSize: 40, marginBottom: spacing.sm },
  errorTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  content: { padding: spacing.layout, paddingBottom: spacing.huge },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestId: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
  },
  statusPillText: { fontSize: 12, fontWeight: typography.fontWeight.bold },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: typography.fontSize.sm, color: colors.textPrimary, fontWeight: typography.fontWeight.medium },
  itemQtyBlock: { alignItems: 'flex-end' },
  itemQtyLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase' },
  itemQtyVal: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  emptyItems: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  totalLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  totalValue: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.black, color: colors.primary },
  actions: { gap: spacing.md, marginTop: spacing.sm },
  actionBtn: {
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnSuccess: { backgroundColor: colors.accentGreen },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: colors.surface, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  completedBanner: {
    backgroundColor: colors.accentGreenLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  completedText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.accentGreen },
});

export default MaterialRequestDetailScreen;

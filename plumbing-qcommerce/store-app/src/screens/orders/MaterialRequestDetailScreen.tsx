import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { MaterialRequest } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'MaterialRequestDetail'>;

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED: { label: 'Pending Customer Approval', color: colors.textMuted, bg: colors.surfaceContainerLow },
  APPROVED: { label: 'Approved by Customer (Action Req.)', color: colors.warning, bg: colors.warningLight },
  STORE_ACCEPTED: { label: 'Request Accepted', color: colors.primary, bg: colors.surfaceContainerLow },
  PREPARING: { label: 'Preparing / Packing', color: '#2E9AE0', bg: '#E7F5FE' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: colors.secondary || '#1B6D24', bg: colors.successLight },
  PLUMBER_AT_STORE: { label: 'Plumber Arrived at Store', color: colors.secondary || '#1B6D24', bg: colors.successLight },
  COLLECTED: { label: 'Materials Collected ✓', color: '#6B7280', bg: '#F3F4F6' },
  REJECTED: { label: 'Request Rejected', color: colors.danger, bg: colors.dangerLight },
};

const REJECTION_REASONS = [
  'Insufficient Hardware Stock',
  'Item Temporarily Unavailable',
  'Store Operational Overload',
  'Other / Custom Reason',
];

export function MaterialRequestDetailScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const req = await materialRequestService.getById(requestId);
      setRequest(req);
    } catch (err: any) {
      setError(err.message || 'Unable to load material request.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleAcceptRequest = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const updated = await materialRequestService.prepareOrder(request.id as number);
      setRequest(updated);
      Alert.alert(
        'Request Accepted!',
        'You have accepted this material request. Stock is reserved and preparation has started.'
      );
    } catch (err: any) {
      Alert.alert('Acceptance Failed', err.message || 'Could not accept material request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!request) return;
    setRejectModalVisible(false);
    setActionLoading(true);
    try {
      const updated = await materialRequestService.rejectRequest(request.id as number, selectedReason);
      setRequest(updated);
      Alert.alert(
        'Request Rejected',
        `Material Request #${request.id} has been marked as REJECTED with reason: ${selectedReason}`
      );
    } catch (err: any) {
      Alert.alert('Rejection Failed', err.message || 'Could not reject material request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const updated = await materialRequestService.completePreparation(request.id as number);
      setRequest(updated);
      Alert.alert(
        'Materials Ready!',
        'Materials marked ready for pickup. Plumber and Customer have been notified.'
      );
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not mark materials as ready.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusConfig = STATUS_LABELS[request?.rawStatus || request?.status || 'REQUESTED'] || STATUS_LABELS.REQUESTED;
  const canAccept = request?.status === 'PENDING' || request?.rawStatus === 'APPROVED' || request?.rawStatus === 'REQUESTED';
  const canMarkReady = request?.status === 'PREPARING' || request?.rawStatus === 'STORE_ACCEPTED' || request?.rawStatus === 'RESERVED' || request?.rawStatus === 'PREPARING';
  const canReject = request?.status !== 'COMPLETED' && request?.status !== 'REJECTED' && request?.rawStatus !== 'COLLECTED' && request?.rawStatus !== 'READY_FOR_PICKUP';

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
        <Text style={styles.headerTitle}>Material Request #{requestId}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading request details...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Request Detail Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRequest}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : request ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header Row */}
          <View style={styles.idRow}>
            <Text style={styles.requestId}>Request #{request.id}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Metadata Card */}
          <View style={styles.card}>
            <Row label="Service Order" value={`#${request.serviceOrderId}`} />
            <Row label="Assigned Plumber" value={request.plumberName || 'Field Technician'} />
            <Row label="Store ID" value={`${request.storeId}`} />
            <Row
              label="Requested Date"
              value={new Date(request.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            />
          </View>

          {/* Requested Items Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Requested Materials</Text>
            {(request.items || []).map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemCategory}>Product ID: #{item.productId}</Text>
                </View>
                <View style={styles.itemQtyBlock}>
                  <Text style={styles.itemQtyLabel}>Quantity</Text>
                  <Text style={styles.itemQtyVal}>{item.quantity} Units</Text>
                </View>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Value</Text>
              <Text style={styles.totalValue}>₹{(request.totalAmount || 0).toFixed(2)}</Text>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.actions}>
            {canAccept && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary, actionLoading && styles.actionBtnDisabled]}
                onPress={handleAcceptRequest}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionBtnText}>Accept Request & Start Prep</Text>
                )}
              </TouchableOpacity>
            )}

            {canMarkReady && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSuccess, actionLoading && styles.actionBtnDisabled]}
                onPress={handleMarkReady}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionBtnText}>✓ Mark Ready for Pickup</Text>
                )}
              </TouchableOpacity>
            )}

            {canReject && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger, actionLoading && styles.actionBtnDisabled]}
                onPress={() => setRejectModalVisible(true)}
                disabled={actionLoading}
              >
                <Text style={styles.actionBtnDangerText}>Reject Request</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : null}

      {/* Reject Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Material Request #{requestId}</Text>
            <Text style={styles.modalSub}>Select structured rejection reason to persist to backend:</Text>

            {REJECTION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonOption, selectedReason === reason && styles.reasonOptionSelected]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
                  {selectedReason === reason ? '✓ ' : ''}{reason}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleConfirmReject}
              >
                <Text style={styles.modalBtnConfirmText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.layout },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  errorIcon: { fontSize: 32 },
  errorTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  errorMessage: { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  content: { padding: spacing.layout, paddingBottom: spacing.giant },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestId: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusPillText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
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
  infoValue: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  itemCategory: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemQtyBlock: { alignItems: 'flex-end' },
  itemQtyLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase' },
  itemQtyVal: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  totalLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: typography.fontWeight.bold, color: colors.primaryContainer || colors.primary },
  actions: { gap: spacing.md, marginTop: spacing.xs },
  actionBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: { backgroundColor: colors.primaryContainer || colors.primary },
  actionBtnSuccess: { backgroundColor: colors.secondary || '#1B6D24' },
  actionBtnDanger: { backgroundColor: colors.dangerLight || '#FFDAD6', borderWidth: 1, borderColor: colors.danger },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  actionBtnDangerText: { color: colors.danger, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.layout,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.layout,
    gap: spacing.xs,
    ...shadows.md,
  },
  modalTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  modalSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs },
  reasonOption: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    marginBottom: 6,
  },
  reasonOptionSelected: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight || '#FFDAD6',
  },
  reasonText: { fontSize: typography.fontSize.xs, color: colors.textPrimary },
  reasonTextSelected: { fontWeight: typography.fontWeight.bold, color: colors.danger },
  modalBtnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: { backgroundColor: colors.surfaceContainerLow || '#F4F3F7', borderWidth: 1, borderColor: colors.border || '#C6C5D4' },
  modalBtnCancelText: { fontSize: typography.fontSize.xs, color: colors.textPrimary, fontWeight: typography.fontWeight.bold },
  modalBtnConfirm: { backgroundColor: colors.danger },
  modalBtnConfirmText: { fontSize: typography.fontSize.xs, color: '#FFFFFF', fontWeight: typography.fontWeight.bold },
});

export default MaterialRequestDetailScreen;

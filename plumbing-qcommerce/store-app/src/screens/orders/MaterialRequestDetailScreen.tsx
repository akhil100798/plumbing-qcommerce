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
import { StatusChip } from '../../components/common/StatusChip';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { MaterialRequest } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'MaterialRequestDetail'>;

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
      Alert.alert('Request Accepted', 'Stock reserved. Preparation started.');
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
      Alert.alert('Request Rejected', `Request #${request.id} has been rejected.`);
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
      Alert.alert('Materials Ready', 'Marked ready for pickup. Notifications sent.');
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not mark materials as ready.');
    } finally {
      setActionLoading(false);
    }
  };

  const rawStatus = request?.rawStatus || request?.status || 'REQUESTED';
  const canAccept = rawStatus === 'STORE_REVIEWING';
  const canMarkReady = ['STORE_ACCEPTED', 'RESERVED', 'PREPARING'].includes(rawStatus);
  const canReject = !['COMPLETED', 'REJECTED', 'COLLECTED', 'READY_FOR_PICKUP'].includes(rawStatus);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
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
        <Text style={styles.headerTitle}>Request #{requestId}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRequest}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : request ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.idRow}>
            <Text style={styles.requestId}>Request #{request.id}</Text>
            <StatusChip status={rawStatus} />
          </View>

          <View style={styles.card}>
            <Row label="Service Order" value={`#${request.serviceOrderId}`} />
            <Row label="Plumber" value={request.plumberName || 'Field Technician'} />
            <Row label="Store ID" value={`${request.storeId}`} />
            <Row label="Date" value={new Date(request.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Requested Materials</Text>
            {(request.items || []).map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemCategory}>#{item.productId}</Text>
                </View>
                <View style={styles.itemQtyBlock}>
                  <Text style={styles.itemQtyLabel}>Qty</Text>
                  <Text style={styles.itemQtyVal}>{item.quantity}</Text>
                </View>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{(request.totalAmount || 0).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            {canAccept && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary, actionLoading && styles.actionBtnDisabled]}
                onPress={handleAcceptRequest}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.actionBtnText}>Accept & Start Prep</Text>
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
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.actionBtnText}>Mark Ready for Pickup</Text>
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

      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Request #{requestId}</Text>
            <Text style={styles.modalSub}>Select reason for rejection:</Text>
            {REJECTION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonOption, selectedReason === reason && styles.reasonOptionSelected]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setRejectModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={handleConfirmReject}>
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
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.layout },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  errorIcon: { fontSize: 24, fontWeight: 'bold', color: colors.danger, marginBottom: spacing.xs },
  errorTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  errorMessage: { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  retryBtnText: { color: colors.onPrimary, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  content: { padding: spacing.layout, paddingBottom: spacing.giant },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  requestId: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow },
  infoLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  infoValue: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow },
  itemInfo: { flex: 1 },
  itemName: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  itemCategory: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemQtyBlock: { alignItems: 'flex-end' },
  itemQtyLabel: { fontSize: 10, color: colors.textMuted },
  itemQtyVal: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.xs },
  totalLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: typography.fontWeight.bold, color: colors.primary },
  actions: { gap: spacing.md, marginTop: spacing.xs },
  actionBtn: { height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnSuccess: { backgroundColor: colors.success },
  actionBtnDanger: { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: colors.onPrimary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  actionBtnDangerText: { color: colors.danger, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.layout },
  modalCard: { width: '100%', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.layout, gap: spacing.xs, ...shadows.md },
  modalTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  modalSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs },
  reasonOption: { padding: spacing.md, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceContainerLow, marginBottom: 6 },
  reasonOptionSelected: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  reasonText: { fontSize: typography.fontSize.xs, color: colors.textPrimary },
  reasonTextSelected: { fontWeight: typography.fontWeight.bold, color: colors.danger },
  modalBtnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalBtn: { flex: 1, height: 44, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancel: { backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border },
  modalBtnCancelText: { fontSize: typography.fontSize.xs, color: colors.textPrimary, fontWeight: typography.fontWeight.bold },
  modalBtnConfirm: { backgroundColor: colors.danger },
  modalBtnConfirmText: { fontSize: typography.fontSize.xs, color: colors.onPrimary, fontWeight: typography.fontWeight.bold },
});

export default MaterialRequestDetailScreen;
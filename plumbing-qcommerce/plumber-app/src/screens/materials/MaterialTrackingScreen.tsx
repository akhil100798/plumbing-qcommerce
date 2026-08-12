import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { materialService } from '../../services/materials/materialService';
import { materialResumeRoute } from './materialResumeRoute';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'MaterialTracking'>;

type RawStatus =
  | 'REQUESTED'
  | 'STORE_REVIEWING'
  | 'APPROVED'
  | 'PARTIALLY_AVAILABLE'
  | 'REJECTED'
  | 'RESERVED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PLUMBER_AT_STORE'
  | 'COLLECTED'
  | 'CANCELLED';

interface RequestDetail {
  id: number;
  status: RawStatus;
  storeName: string;
  storeAddress: string;
  totalAmount: number;
  storeConfirmedAt?: string | null;
  plumberArrivedAt?: string | null;
  plumberCollectedAt?: string | null;
  collectionConfirmedAt?: string | null;
  notes?: string | null;
  items: { productName: string; requestedQuantity: number; reservedQuantity: number }[];
}

interface PickupStep {
  id: string;
  label: string;
  sublabel?: string;
  done: boolean;
  current: boolean;
  timestamp?: string | null;
}

function buildSteps(d: RequestDetail): PickupStep[] {
  const s = d.status;
  const storeAccepted = ['RESERVED', 'PREPARING', 'READY_FOR_PICKUP', 'PLUMBER_AT_STORE', 'COLLECTED'].includes(s);
  const packed = ['READY_FOR_PICKUP', 'PLUMBER_AT_STORE', 'COLLECTED'].includes(s);
  const arrived = ['PLUMBER_AT_STORE', 'COLLECTED'].includes(s);
  const collected = s === 'COLLECTED';

  return [
    {
      id: 'requested',
      label: 'Request Submitted',
      sublabel: 'Waiting for store review',
      done: true,
      current: s === 'REQUESTED' || s === 'STORE_REVIEWING',
    },
    {
      id: 'approved',
      label: 'Store Accepted',
      sublabel: storeAccepted ? 'Store confirmed available materials' : 'Waiting for store to accept',
      done: storeAccepted,
      current: s === 'APPROVED' || s === 'PARTIALLY_AVAILABLE' || s === 'RESERVED',
      timestamp: d.storeConfirmedAt,
    },
    {
      id: 'packing',
      label: 'Being Prepared',
      sublabel: packed ? 'Materials packed and ready' : 'Store is packing your materials',
      done: packed,
      current: s === 'PREPARING',
      timestamp: packed ? d.storeConfirmedAt : null,
    },
    {
      id: 'pickup',
      label: 'Ready for Pickup',
      sublabel: arrived ? 'You arrived at store' : 'Head to the store to collect',
      done: arrived,
      current: s === 'READY_FOR_PICKUP',
    },
    {
      id: 'collected',
      label: 'Collection Confirmed',
      sublabel: collected ? 'Materials collected — resume work!' : 'Pending store confirmation',
      done: collected,
      current: s === 'PLUMBER_AT_STORE',
      timestamp: d.collectionConfirmedAt,
    },
  ];
}

function fmtTime(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MaterialTrackingScreen({ route, navigation }: Props) {
  const { jobId, productOrderId } = route.params;
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setError(null);
      const raw = await materialService.fetchMaterialDetails(productOrderId);
      setDetail(raw as RequestDetail);
    } catch (err: any) {
      // No mock fallback — surface real error so the user can retry.
      setError(err.message || 'Unable to load material request details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [productOrderId]);

  useEffect(() => {
    fetchDetail();
    const timer = setInterval(fetchDetail, 3000);
    return () => clearInterval(timer);
  }, [fetchDetail]);

  const handleArrived = async () => {
    if (!detail) return;
    setActionLoading(true);
    try {
      await materialService.markArrivedAtStore(productOrderId);
      await fetchDetail();
      Alert.alert('Confirmed', 'Arrival at store recorded. Collect your materials and show the store the order ID.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to mark arrival');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCollection = async () => {
    if (!detail) return;
    try {
      await materialService.confirmCollection(productOrderId);
    } catch (e: any) {
      console.warn('Collection error:', e);
    }
    const destination = materialResumeRoute(String(jobId));
    navigation.navigate(destination.name, destination.params);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this material request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              await materialService.cancelMaterialRequest(productOrderId, 'Cancelled by plumber');
              navigation.navigate('StartWork', { jobId: String(jobId) });
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const handleContinueWork = () => {
    const destination = materialResumeRoute(String(jobId));
    navigation.navigate(destination.name, destination.params);
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <AppHeader title="Material Pickup Status" onBackPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('Main', { screen: 'Home' });
        }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading status…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !detail) {
    return (
      <ScreenWrapper>
        <AppHeader title="Material Pickup Status" onBackPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('Main', { screen: 'Home' });
        }} />
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could Not Load Tracking</Text>
          <Text style={styles.errorMessage}>
            {error || 'Material request details are unavailable.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchDetail}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const isCancelled = detail.status === 'CANCELLED';
  const isCollected = detail.status === 'COLLECTED';
  const isRejected = detail.status === 'REJECTED';
  const canMarkArrived = detail.status === 'READY_FOR_PICKUP';
  const canConfirmCollection = detail.status === 'PLUMBER_AT_STORE' || detail.status === 'READY_FOR_PICKUP';

  const steps = buildSteps(detail);

  const guidance = (() => {
    switch (detail.status) {
      case 'REQUESTED':
      case 'STORE_REVIEWING':
      case 'APPROVED':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          icon: '⏳',
          title: 'Request Sent to Store',
          desc: 'Your material request has been submitted. Store manager will pack your materials shortly.',
        };
      case 'RESERVED':
      case 'PREPARING':
        return {
          bg: '#E7F5FE',
          border: '#B9E2FE',
          icon: '📦',
          title: 'Store is Packing Materials',
          desc: 'The store manager is preparing your items. You will be notified as soon as it is ready for pickup.',
        };
      case 'READY_FOR_PICKUP':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          icon: '🛵',
          title: 'Materials Ready for Pickup!',
          desc: 'Travel to the hardware store. Click "I\'ve Arrived at the Store" when you arrive.',
        };
      case 'PLUMBER_AT_STORE':
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          icon: '🏪',
          title: 'At Store — Handover Items',
          desc: `Show Request #${productOrderId} to store staff, collect items, and tap "I've Collected the Materials".`,
        };
      case 'COLLECTED':
        return {
          bg: '#F0FDF4',
          border: '#86EFAC',
          icon: '✅',
          title: 'Materials Collected!',
          desc: 'Return to customer site and click "Continue Job" to resume work.',
        };
      default:
        return null;
    }
  })();

  return (
    <ScreenWrapper safeAreaStyle={Platform.OS === 'web' ? { height: '100vh' as any, maxHeight: '100vh' as any, overflow: 'hidden' } : undefined}>
      <AppHeader title="Material Pickup Status" onBackPress={() => navigation.goBack()} />

      <View style={styles.mainLayout}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>

          {/* Flash Toast Banner */}
          <View style={styles.flashBanner}>
            <Text style={styles.flashText}>✓ Material request submitted successfully!</Text>
          </View>

          {/* Guidance Card */}
          {guidance && (
            <View style={[styles.guidanceCard, { backgroundColor: guidance.bg, borderColor: guidance.border }]}>
              <View style={styles.guidanceRow}>
                <Text style={styles.guidanceIcon}>{guidance.icon}</Text>
                <View style={styles.guidanceContent}>
                  <Text style={styles.guidanceTitle}>{guidance.title}</Text>
                  <Text style={styles.guidanceDesc}>{guidance.desc}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Store info card */}
          <View style={styles.storeCard}>
            <Text style={styles.storeLabel}>Pickup from</Text>
            <Text style={styles.storeName}>{detail.storeName}</Text>
            <Text style={styles.storeAddress}>{detail.storeAddress}</Text>
          </View>

          {/* Status badge */}
          {(isCancelled || isRejected) && (
            <View style={[styles.statusBadge, styles.badgeDanger]}>
              <Text style={styles.badgeText}>
                {isCancelled ? '⚠ Request Cancelled' : '✕ Request Rejected by Store'}
              </Text>
              {detail.notes && <Text style={styles.badgeNote}>{detail.notes}</Text>}
            </View>
          )}
          {isCollected && (
            <View style={[styles.statusBadge, styles.badgeSuccess]}>
              <Text style={styles.badgeText}>✓ Materials Collected — Resume Work!</Text>
            </View>
          )}

          {/* Timeline */}
          {!isCancelled && !isRejected && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Pickup Progress</Text>
              <View style={styles.timeline}>
                {steps.map((step, index) => (
                  <View key={step.id} style={styles.timelineRow}>
                    <View style={styles.indicatorCol}>
                      <View style={[
                        styles.dot,
                        step.done && styles.dotDone,
                        step.current && !step.done && styles.dotCurrent,
                      ]} />
                      {index < steps.length - 1 && (
                        <View style={[styles.line, steps[index + 1].done && styles.lineDone]} />
                      )}
                    </View>
                    <View style={styles.contentCol}>
                      <View style={styles.textRow}>
                        <Text style={[
                          styles.label,
                          step.done && styles.labelDone,
                          step.current && !step.done && styles.labelCurrent,
                        ]}>
                          {step.label}
                        </Text>
                        {step.timestamp && (
                          <Text style={styles.time}>{fmtTime(step.timestamp)}</Text>
                        )}
                      </View>
                      {step.sublabel && (
                        <Text style={styles.sublabel}>{step.sublabel}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Items summary */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Items</Text>
            {detail.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemQty}>
                  {item.reservedQuantity > 0
                    ? `${item.reservedQuantity} / ${item.requestedQuantity} reserved`
                    : `${item.requestedQuantity} requested`}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{detail.totalAmount?.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.stickyFooter}>
          {canConfirmCollection && !isCollected && (
            <PrimaryButton
              title="I've Collected Materials from Store"
              onPress={handleConfirmCollection}
              loading={actionLoading}
              style={styles.actionBtn}
            />
          )}
          {isCollected && (
            <PrimaryButton
              title="Resume Work & Return to Job"
              onPress={handleContinueWork}
              style={styles.actionBtn}
            />
          )}
          {canMarkArrived && !canConfirmCollection && (
            <PrimaryButton
              title="I've Arrived at the Store"
              onPress={handleArrived}
              loading={actionLoading}
              style={styles.actionBtn}
            />
          )}
          {isRejected && (
            <PrimaryButton
              title="Select Alternative Hardware Store"
              onPress={() => navigation.navigate('StoreSelection', { jobId })}
              style={styles.actionBtn}
            />
          )}
          {!isCollected && !isCancelled && !isRejected && (
            <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.layout },
  loadingText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm },
  errorIcon: { fontSize: 40, marginBottom: spacing.sm },
  errorTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryBtnText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  mainLayout: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  content: { padding: spacing.layout, paddingBottom: spacing.giant },
  stickyFooter: {
    backgroundColor: colors.surface || '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border || '#E5E7EB',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    ...shadows.md,
  },
  flashBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  flashText: {
    color: '#166534',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  guidanceCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  guidanceIcon: { fontSize: 24, marginTop: 2 },
  guidanceContent: { flex: 1 },
  guidanceTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  guidanceDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  storeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  storeLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  storeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  storeAddress: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badgeDanger: { backgroundColor: colors.errorLight || '#FFEEEE', borderWidth: 1, borderColor: colors.error },
  badgeSuccess: { backgroundColor: colors.successLight || '#EEFFEE', borderWidth: 1, borderColor: colors.success },
  badgeText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  badgeNote: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  timeline: { paddingLeft: spacing.xs },
  timelineRow: { flexDirection: 'row', minHeight: 52 },
  indicatorCol: { alignItems: 'center', marginRight: spacing.md },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.borderDark,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  dotDone: { backgroundColor: colors.success },
  dotCurrent: { backgroundColor: colors.primary, transform: [{ scale: 1.3 }] },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  lineDone: { backgroundColor: colors.success },
  contentCol: { flex: 1, paddingBottom: spacing.sm },
  textRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textMuted },
  labelDone: { color: colors.textPrimary, fontWeight: typography.fontWeight.semibold },
  labelCurrent: { color: colors.primary, fontWeight: typography.fontWeight.bold },
  time: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  sublabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  itemName: { fontSize: typography.fontSize.sm, color: colors.textPrimary, flex: 1 },
  itemQty: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  totalAmount: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
  actions: { gap: spacing.md },
  actionBtn: { width: '100%' },
  cancelLink: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { fontSize: typography.fontSize.sm, color: colors.error, fontWeight: typography.fontWeight.medium },
});

export default MaterialTrackingScreen;

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import {
  SvgActionCheck,
  SvgActionNavigate,
  SvgMatPackageBox,
  SvgStatusAlert,
  SvgStatusClock,
} from '../../assets/svg';
import PhoneIcon from '../../assets/icons/phone.svg';

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
  title: string;
  description: string;
  done: boolean;
  current: boolean;
  timestamp?: string | null;
}

function buildSteps(d: RequestDetail): PickupStep[] {
  const s = d.status;
  const isApproved = ['APPROVED', 'PARTIALLY_AVAILABLE', 'RESERVED', 'PREPARING', 'READY_FOR_PICKUP', 'PLUMBER_AT_STORE', 'COLLECTED'].includes(s);
  const isPreparing = ['PREPARING', 'READY_FOR_PICKUP', 'PLUMBER_AT_STORE', 'COLLECTED'].includes(s);
  const isReady = ['READY_FOR_PICKUP', 'PLUMBER_AT_STORE', 'COLLECTED'].includes(s);
  const isCollected = s === 'COLLECTED';

  return [
    {
      id: 'requested',
      title: 'Requested',
      description: 'Order sent to store manager',
      done: true,
      current: s === 'REQUESTED' || s === 'STORE_REVIEWING',
    },
    {
      id: 'approved',
      title: 'Approved',
      description: isApproved ? 'Budget and items confirmed' : 'Waiting for store confirmation',
      done: isApproved,
      current: s === 'APPROVED' || s === 'PARTIALLY_AVAILABLE' || s === 'RESERVED',
      timestamp: d.storeConfirmedAt,
    },
    {
      id: 'preparing',
      title: 'Store Preparing',
      description: isPreparing ? 'Items packed at counter' : 'Store will pack materials',
      done: isPreparing,
      current: s === 'PREPARING',
      timestamp: isPreparing ? d.storeConfirmedAt : null,
    },
    {
      id: 'ready',
      title: 'Ready for Pickup',
      description: isReady ? 'Counter #3 - Ready for Plumber' : 'Waiting for packing completion',
      done: isReady,
      current: s === 'READY_FOR_PICKUP',
    },
    {
      id: 'collected',
      title: 'Collected by Plumber',
      description: isCollected ? 'Handover completed' : 'Handover and verification pending',
      done: isCollected,
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
  const { jobId = 'JOB-1024', productOrderId = 101 } = (route as any)?.params || {};
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
      setError(err.message || 'Unable to load material request details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [productOrderId]);

  useEffect(() => {
    fetchDetail();
    const timer = setInterval(fetchDetail, 8000);
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
    setActionLoading(true);
    try {
      await materialService.confirmCollection(productOrderId);
      await fetchDetail();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to confirm collection');
    } finally {
      setActionLoading(false);
    }
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
              navigation.replace('ActiveJob', { jobId });
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const handleContinueWork = () => {
    navigation.replace('ActiveJob', { jobId });
  };

  if (loading) {
    return (
      <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.stitchBlue }}>
        <AppHeader
          title="Material Tracking"
          variant="blue"
          onBackPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'Home' });
          }}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.stitchBlue} />
          <Text style={styles.loadingText}>Loading status…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !detail) {
    return (
      <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.stitchBlue }}>
        <AppHeader
          title="Material Tracking"
          variant="blue"
          onBackPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'Home' });
          }}
        />
        <View style={styles.center}>
          <SvgStatusAlert width={44} height={44} fill="#EF4444" />
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
  const canConfirmCollection = detail.status === 'PLUMBER_AT_STORE';

  const steps = buildSteps(detail);

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.stitchBlue }}>
      <AppHeader
        title="Material Tracking"
        variant="blue"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stitch Order Summary Header */}
        <View style={styles.orderSummaryCard}>
          <View>
            <Text style={styles.orderIdLabel}>ORDER ID</Text>
            <Text style={styles.orderIdValue}>MR{productOrderId}</Text>
          </View>
          <View style={styles.pickupPill}>
            <Text style={styles.pickupPillText}>Store Pickup</Text>
          </View>
        </View>

        {/* Stitch Error / Cancelled Banner */}
        {(isCancelled || isRejected) && (
          <View style={[styles.statusBanner, styles.bannerDanger]}>
            <Text style={styles.bannerTitle}>
              {isCancelled ? 'Request Cancelled' : 'Request Rejected by Store'}
            </Text>
            {detail.notes && <Text style={styles.bannerNote}>{detail.notes}</Text>}
          </View>
        )}

        {/* Stitch Collected Banner */}
        {isCollected && (
          <View style={[styles.statusBanner, styles.bannerSuccess]}>
            <SvgActionCheck width={16} height={16} fill="#059669" />
            <Text style={styles.bannerSuccessTitle}>Materials Collected — Resume Work!</Text>
          </View>
        )}

        {/* Stitch Fulfillment Timeline */}
        {!isCancelled && !isRejected && (
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTitle}>PICKUP PROGRESS</Text>
              <View style={styles.estimatedPill}>
                <Text style={styles.estimatedText}>Estimated: On Time</Text>
              </View>
            </View>

            <View style={styles.timelineList}>
              {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                return (
                  <View key={step.id} style={styles.stepRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.stepBullet,
                          step.done && styles.stepBulletDone,
                          step.current && !step.done && styles.stepBulletCurrent,
                        ]}
                      >
                        {step.done ? (
                          <SvgActionCheck width={10} height={10} fill="#FFFFFF" />
                        ) : step.current ? (
                          <View style={styles.bulletDot} />
                        ) : null}
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.stepConnector,
                            steps[index + 1].done && styles.stepConnectorDone,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.stepContentCol}>
                      <View style={styles.stepTextRow}>
                        <Text
                          style={[
                            styles.stepTitle,
                            step.done && styles.stepTitleDone,
                            step.current && styles.stepTitleCurrent,
                          ]}
                        >
                          {step.title}
                        </Text>
                        {step.timestamp ? (
                          <Text style={styles.stepTime}>{fmtTime(step.timestamp)}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Stitch Store Details Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeTopRow}>
            <View style={styles.storeIconBox}>
              <SvgMatPackageBox width={20} height={20} stroke={colors.stitchBlue} fill="none" />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{detail.storeName || 'FixKart Hardware Hub'}</Text>
              <Text style={styles.storeAddress}>{detail.storeAddress || 'Store address'}</Text>
              <View style={styles.storeStatusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.storeStatusText}>Open until 9:00 PM • Token #{productOrderId}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.callStoreBtn}
              onPress={() => Alert.alert('Contact Store', `Calling ${detail.storeName}`)}
              accessibilityLabel="Call Store"
            >
              <PhoneIcon width={16} height={16} stroke="#059669" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stitch Items Summary Card */}
        <View style={styles.itemsCard}>
          <Text style={styles.itemsSectionLabel}>ITEMS REQUESTED</Text>
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
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{detail.totalAmount?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Stitch Dynamic Actions */}
        <View style={styles.actionContainer}>
          {canMarkArrived && (
            <PrimaryButton
              title="I've Arrived at the Store"
              onPress={handleArrived}
              loading={actionLoading}
              variant="blue"
            />
          )}
          {canConfirmCollection && (
            <PrimaryButton
              title="I've Collected the Materials"
              onPress={handleConfirmCollection}
              loading={actionLoading}
              variant="green"
            />
          )}
          {isCollected && (
            <PrimaryButton
              title="Continue Job"
              onPress={handleContinueWork}
              variant="blue"
            />
          )}
          {!isCollected && !isCancelled && !isRejected && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#F8FAFC',
    gap: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.stitchBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  orderSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  orderIdValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  pickupPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pickupPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.stitchBlue,
  },
  statusBanner: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  bannerDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  bannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  bannerSuccessTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  bannerNote: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 4,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  estimatedPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  estimatedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  timelineList: {
    gap: 2,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepBulletDone: {
    backgroundColor: colors.stitchGreen,
    borderColor: colors.stitchGreen,
  },
  stepBulletCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.stitchBlue,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.stitchBlue,
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  stepConnectorDone: {
    backgroundColor: colors.stitchGreen,
  },
  stepContentCol: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 12,
  },
  stepTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTitleDone: {
    color: '#1E293B',
    fontWeight: '700',
  },
  stepTitleCurrent: {
    color: colors.stitchBlue,
    fontWeight: '700',
  },
  stepTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stepDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  storeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  storeAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  storeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  storeStatusText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  callStoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  itemsSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.stitchBlue,
  },
  actionContainer: {
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
});

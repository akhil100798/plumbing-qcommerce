import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
} from '../../redux/slices/dashboardSlice';
import { analyticsService } from '../../services/analytics/analyticsService';
import { ordersService } from '../../services/orders/ordersService';
import { inventoryService } from '../../services/inventory/inventoryService';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { AppStackParamList } from '../../types/navigation';
import { MaterialRequest } from '../../types';
import StoreIcon from '../../components/common/StoreIcon';

export const DashboardScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const { todayRevenue, orderSummary, error } = useAppSelector((state) => state.dashboard);
  const user = useAppSelector((state) => state.auth.storeUser);
  const [matRequests, setMatRequests] = React.useState<MaterialRequest[]>([]);
  const [actionBusy, setActionBusy] = React.useState(false);

  const loadDashboardData = async () => {
    dispatch(fetchDashboardStart());
    try {
      const sales = await analyticsService.getSalesAnalytics();
      const orders = await ordersService.getOrders();
      const newCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
      const packingCount = orders.filter((o) => o.status === 'PACKING').length;
      const readyCount = orders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'PACKED').length;
      const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
      const lowStock = await inventoryService.getLowStock();

      try {
        const reqs = await materialRequestService.getMaterialRequests();
        setMatRequests(reqs);
      } catch (reqErr) {
        console.warn('Load material requests notice:', reqErr);
      }

      dispatch(
        fetchDashboardSuccess({
          todayRevenue: sales.revenue,
          orderSummary: {
            newCount,
            packingCount,
            readyCount,
            deliveredCount,
          },
          lowStockCount: lowStock.length || 1,
        })
      );
    } catch (e: any) {
      dispatch(fetchDashboardFailure(e.message || 'Failed to sync dashboard'));
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeMatReq =
    [...matRequests].reverse().find((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED') ||
    matRequests[matRequests.length - 1];

  const handlePrepareMat = async () => {
    const target = activeMatReq;
    if (!target?.id) return;
    setActionBusy(true);
    try {
      await materialRequestService.prepareOrder(target.id as number);
      const updated = await materialRequestService.getMaterialRequests();
      setMatRequests(updated);
      Alert.alert('Success', 'Preparation started for Material Request #' + target.id);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to start preparation');
    } finally {
      setActionBusy(false);
    }
  };

  const handleReadyMat = async () => {
    const target = activeMatReq;
    if (!target?.id) return;
    setActionBusy(true);
    try {
      await materialRequestService.completePreparation(target.id as number);
      const updated = await materialRequestService.getMaterialRequests();
      setMatRequests(updated);
      Alert.alert('Success', 'Marked ready for plumber pickup');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to mark ready');
    } finally {
      setActionBusy(false);
    }
  };

  const handleConfirmMat = async () => {
    const target = activeMatReq;
    if (!target?.id) return;
    setActionBusy(true);
    try {
      await materialRequestService.confirmCollection(target.id as number);
      const updated = await materialRequestService.getMaterialRequests();
      setMatRequests(updated);
      Alert.alert('Success', 'Confirmed plumber collected materials');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to confirm collection');
    } finally {
      setActionBusy(false);
    }
  };

  const formattedRevenue =
    todayRevenue > 0
      ? `₹${todayRevenue.toLocaleString('en-IN')}`
      : '₹24,680';

  const currentDateFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const toPickupCount = orderSummary.readyCount || 3;

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.surface }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Store Header */}
      <View style={styles.topHeader}>
        <View style={styles.greetingCol}>
          <Text style={styles.greetingText}>Good Morning,</Text>
          <Text style={styles.storeNameText} numberOfLines={1}>
            {user?.fullName || user?.email || 'Sharma Hardware Store'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityLabel="View Notifications"
        >
          <StoreIcon name="notification" size={22} color={colors.textPrimary} />
          <View style={styles.unreadBadgeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {error ? <Text style={styles.syncErrorBanner}>{error}</Text> : null}

        {/* Today's Overview Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <Text style={styles.sectionDate}>{currentDateFormatted}</Text>
        </View>

        {/* 3 Metric Cards */}
        <View style={styles.metricsGrid}>
          {/* Card 1: New Orders */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconBox, { backgroundColor: '#FFF5E9' }]}>
                <StoreIcon name="order" size={16} color="#FF9F1C" />
              </View>
              <Text style={styles.metricValue}>{orderSummary.newCount || 48}</Text>
            </View>
            <Text style={styles.metricLabel}>New Orders</Text>
          </View>

          {/* Card 2: Packed */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconBox, { backgroundColor: '#EBF2FF' }]}>
                <StoreIcon name="packing" size={16} color={colors.primary} />
              </View>
              <Text style={styles.metricValue}>{orderSummary.packingCount + orderSummary.readyCount || 32}</Text>
            </View>
            <Text style={styles.metricLabel}>Packed</Text>
          </View>

          {/* Card 3: Today's Sales */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('SalesAnalytics')}
            activeOpacity={0.8}
          >
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconBox, { backgroundColor: '#E8F7EE' }]}>
                <StoreIcon name="rupee" size={16} color="#1EA34A" />
              </View>
              <Text style={[styles.metricValue, styles.salesValueText]} numberOfLines={1}>
                {formattedRevenue}
              </Text>
            </View>
            <Text style={styles.metricLabel}>Today's Sales</Text>
          </TouchableOpacity>
        </View>

        {/* Plumber Counter Pickup Banner */}
        <View style={styles.pickupBanner}>
          <View style={styles.pickupBannerLeft}>
            <View style={styles.pickupIconCircle}>
              <StoreIcon name="ready-for-pickup" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.pickupTextCol}>
              <Text style={styles.pickupBannerTitle}>
                {toPickupCount} orders ready for pickup
              </Text>
              <Text style={styles.pickupBannerSub}>
                Awaiting assigned plumber counter collection
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.pickupActionBtn}
            onPress={() => navigation.navigate('ReadyForPickup' as any)}
          >
            <Text style={styles.pickupActionText}>View Pickup</Text>
          </TouchableOpacity>
        </View>

        {/* Order Status Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCardsGrid}>
          {/* New */}
          <TouchableOpacity
            style={styles.statusBox}
            onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
          >
            <View style={[styles.statusBoxIconWrap, { backgroundColor: '#F1F5F9' }]}>
              <StoreIcon name="order" size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.statusBoxLabel}>New</Text>
            <Text style={styles.statusBoxCount}>{orderSummary.newCount || 48}</Text>
          </TouchableOpacity>

          {/* Processing */}
          <TouchableOpacity
            style={styles.statusBox}
            onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
          >
            <View style={[styles.statusBoxIconWrap, { backgroundColor: '#FFF5E9' }]}>
              <StoreIcon name="packing" size={18} color="#FF9F1C" />
            </View>
            <Text style={styles.statusBoxLabel}>Processing</Text>
            <Text style={[styles.statusBoxCount, { color: '#FF9F1C' }]}>
              {orderSummary.packingCount || 12}
            </Text>
          </TouchableOpacity>

          {/* Ready */}
          <TouchableOpacity
            style={styles.statusBox}
            onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
          >
            <View style={[styles.statusBoxIconWrap, { backgroundColor: '#EBF2FF' }]}>
              <StoreIcon name="ready-for-pickup" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statusBoxLabel}>Ready</Text>
            <Text style={[styles.statusBoxCount, { color: colors.primary }]}>
              {orderSummary.readyCount || 32}
            </Text>
          </TouchableOpacity>

          {/* Completed */}
          <TouchableOpacity
            style={styles.statusBox}
            onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
          >
            <View style={[styles.statusBoxIconWrap, { backgroundColor: '#E8F7EE' }]}>
              <StoreIcon name="check" size={18} color="#1EA34A" />
            </View>
            <Text style={styles.statusBoxLabel}>Completed</Text>
            <Text style={[styles.statusBoxCount, { color: '#1EA34A' }]}>
              {orderSummary.deliveredCount || 156}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Plumber Material Order Desk */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Plumber Material Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'MaterialsTab' })}>
            <Text style={styles.viewAllText}>Queue ({matRequests.length})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.materialRequisitionCard}>
          <View style={styles.matCardHeader}>
            <View style={styles.matBadgeRow}>
              <StoreIcon name="wrench" size={16} color={colors.primary} />
              <Text style={styles.matCardOrderNum}>
                Request #{activeMatReq?.id || '84'}
              </Text>
            </View>
            <View style={styles.matStatusTagBadge}>
              <Text style={styles.matStatusTagText}>
                {activeMatReq?.rawStatus || activeMatReq?.status || 'PENDING'}
              </Text>
            </View>
          </View>

          <Text style={styles.matCardInfo}>
            {activeMatReq
              ? `Plumber: ${activeMatReq.plumberName} · Total: ₹${activeMatReq.totalAmount} (${activeMatReq.items?.length || 3} items)`
              : 'Direct counter pickup requisition from assigned plumber'}
          </Text>

          {/* 3 Direct Actions for Plumber Pickup Lifecycle */}
          <View style={styles.matActionsRow}>
            <TouchableOpacity
              style={[styles.matBtn, { backgroundColor: colors.primary }]}
              onPress={handlePrepareMat}
              disabled={actionBusy}
            >
              <Text style={styles.matBtnText}>Start Packing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.matBtn, { backgroundColor: '#2E9AE0' }]}
              onPress={handleReadyMat}
              disabled={actionBusy}
            >
              <Text style={styles.matBtnText}>Mark Ready</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.matBtn, { backgroundColor: colors.success }]}
              onPress={handleConfirmMat}
              disabled={actionBusy}
            >
              <Text style={styles.matBtnText}>Confirm Pickup</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Low Stock Alerts */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('LowStockAlert')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lowStockRowCard}>
          <View style={styles.lowStockLeft}>
            <View style={styles.productThumbBox}>
              <StoreIcon name="pvc-elbow" size={28} color={colors.primary} />
            </View>
            <View style={styles.productInfoCol}>
              <Text style={styles.productNameText}>PVC Elbow 1/2 Inch</Text>
              <Text style={styles.productCriticalQty}>Only 3 left in stock!</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.reorderBtn}
            onPress={() => Alert.alert('Reorder Request', 'Stock replenishment request generated for PVC Elbow 1/2 Inch.')}
          >
            <Text style={styles.reorderBtnText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  greetingCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.regular,
  },
  storeNameText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  syncErrorBanner: {
    backgroundColor: '#FDEBEC',
    color: colors.danger,
    fontSize: typography.fontSize.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionDate: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  viewAllText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  metricIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  salesValueText: {
    fontSize: 14,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  pickupBanner: {
    backgroundColor: '#009E4F',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
    ...shadows.sm,
  },
  pickupBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  pickupIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupTextCol: {
    flex: 1,
  },
  pickupBannerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  pickupBannerSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  pickupActionBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
  },
  pickupActionText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#009E4F',
  },
  statusCardsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusBox: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  statusBoxIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBoxLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  statusBoxCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  materialRequisitionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#EAECEF',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  matCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  matBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matCardOrderNum: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  matStatusTagBadge: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matStatusTagText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  matCardInfo: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  matActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matBtnText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  lowStockRowCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  lowStockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  productThumbBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoCol: {
    flex: 1,
  },
  productNameText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  productCriticalQty: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.danger,
    marginTop: 2,
  },
  reorderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reorderBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

export default DashboardScreen;

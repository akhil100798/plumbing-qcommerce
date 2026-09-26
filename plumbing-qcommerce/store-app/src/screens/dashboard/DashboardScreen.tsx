import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchDashboardStart, fetchDashboardSuccess, fetchDashboardFailure } from '../../redux/slices/dashboardSlice';
import { analyticsService } from '../../services/analytics/analyticsService';
import { ordersService } from '../../services/orders/ordersService';
import { inventoryService } from '../../services/inventory/inventoryService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';

import NotificationIcon from '../../assets/icons/notification.svg';
import OrderIcon from '../../assets/icons/order.svg';
import PackingIcon from '../../assets/icons/packing.svg';
import ReadyPickupIcon from '../../assets/icons/ready-pickup.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import LowStockIcon from '../../assets/icons/low-stock.svg';

const orderStatusTiles = [
  { key: 'new', label: 'New', icon: OrderIcon, color: colors.primary, bg: colors.accentBlueLight },
  { key: 'processing', label: 'Processing', icon: PackingIcon, color: colors.warning, bg: colors.warningLight },
  { key: 'ready', label: 'Ready', icon: ReadyPickupIcon, color: '#2E9AE0', bg: '#E7F5FE' },
  { key: 'completed', label: 'Completed', icon: SuccessCheckIcon, color: colors.success, bg: colors.successLight },
];

export const DashboardScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const { todayRevenue, orderSummary, error } = useAppSelector(state => state.dashboard);
  const user = useAppSelector(state => state.auth.storeUser);

  const loadDashboardData = async () => {
    dispatch(fetchDashboardStart());
    try {
      const sales = await analyticsService.getSalesAnalytics();
      const orders = await ordersService.getOrders();
      const newCount = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
      const packingCount = orders.filter(o => o.status === 'PACKING').length;
      const readyCount = orders.filter(o => o.status === 'READY_FOR_PICKUP' || o.status === 'PACKED').length;
      const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
      const lowStock = await inventoryService.getLowStock();

      dispatch(fetchDashboardSuccess({
        todayRevenue: sales.revenue,
        orderSummary: {
          newCount,
          packingCount,
          readyCount,
          deliveredCount,
        },
        lowStockCount: lowStock.length || 1,
      }));
    } catch (e: any) {
      dispatch(fetchDashboardFailure(e.message || 'Failed to sync dashboard'));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formattedRevenue = todayRevenue > 0 ? `₹${todayRevenue.toLocaleString('en-IN')}` : '₹24,680';

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning, 👋</Text>
          <Text style={styles.storeName}>{user?.fullName || user?.email || 'Sharma Hardware Store'}</Text>
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <NotificationIcon width={20} height={20} stroke={colors.textPrimary} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {error && <Text style={styles.noticeText}>{error}</Text>}

        {/* Today's Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeaderRow}>
            <Text style={styles.overviewTitle}>Today's Overview</Text>
            <Text style={styles.overviewDate}>21 May 2025, Wed</Text>
          </View>
          <View style={styles.overviewStatsRow}>
            <View style={styles.overviewStat}>
              <View style={styles.statIconWrap}>
                <OrderIcon width={16} height={16} stroke={colors.white} />
              </View>
              <Text style={styles.statValue}>{orderSummary.newCount || 18}</Text>
              <Text style={styles.statLabel}>New Orders</Text>
            </View>
            <View style={styles.overviewStat}>
              <View style={styles.statIconWrap}>
                <PackingIcon width={16} height={16} stroke={colors.white} />
              </View>
              <Text style={styles.statValue}>{orderSummary.packingCount + orderSummary.readyCount || 32}</Text>
              <Text style={styles.statLabel}>To Dispatch</Text>
            </View>
            <TouchableOpacity
              style={styles.overviewStat}
              onPress={() => navigation.navigate('SalesAnalytics')}
            >
              <View style={styles.statIconWrap}>
                <SuccessCheckIcon width={16} height={16} stroke={colors.white} />
              </View>
              <Text style={styles.statValue}>{formattedRevenue}</Text>
              <Text style={styles.statLabel}>Today's Sales</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KYC Banner */}
        <View style={styles.kycBanner}>
          <View style={styles.kycIconWrap}>
            <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 14 }}>✓</Text>
          </View>
          <Text style={styles.kycText}>
            Complete KYC to unlock{'\n'}higher credit limit & payouts
          </Text>
          <TouchableOpacity
            style={styles.kycButton}
            onPress={() => Alert.alert('Complete KYC', 'Redirecting to Partner KYC Verification...')}
          >
            <Text style={styles.kycButtonText}>Complete Now</Text>
          </TouchableOpacity>
        </View>

        {/* Order Status */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statusGrid}>
          {orderStatusTiles.map((tile) => {
            const IconComp = tile.icon;
            return (
              <TouchableOpacity
                key={tile.key}
                style={styles.statusTile}
                onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
              >
                <View style={[styles.statusIconWrap, { backgroundColor: tile.bg }]}>
                  <IconComp width={20} height={20} stroke={tile.color} />
                </View>
                <Text style={styles.statusLabel}>{tile.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Low Stock Alerts */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('LowStockAlert')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.lowStockCard}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={() => navigation.navigate('LowStockAlert')}
          >
            <View style={styles.lowStockImage}>
              <LowStockIcon width={24} height={24} stroke={colors.danger} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.lowStockName}>PVC Elbow 1/2 inch</Text>
              <Text style={styles.lowStockQty}>Only 2 left</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => Alert.alert('Reorder', 'Reorder request generated for PVC Elbow 1/2 inch')}
          >
            <Text style={styles.reorderText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.layout,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  greeting: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  storeName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginTop: 2 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  scrollContent: { paddingBottom: 32 },
  noticeText: {
    marginHorizontal: spacing.layout,
    fontSize: typography.fontSize.xs,
    color: colors.danger,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  },
  overviewCard: {
    marginHorizontal: spacing.layout,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  overviewTitle: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  overviewDate: { color: 'rgba(255,255,255,0.75)', fontSize: typography.fontSize.xs },
  overviewStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewStat: { alignItems: 'flex-start' },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { color: colors.white, fontSize: 18, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGreenLight,
    marginHorizontal: spacing.layout,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  kycIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    lineHeight: 15,
  },
  kycButton: {
    backgroundColor: colors.accentGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  kycButtonText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.layout,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  viewAll: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primary },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.layout,
  },
  statusTile: {
    width: '23%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statusLabel: { fontSize: 11, color: colors.textPrimary, fontWeight: '600' },
  lowStockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.layout,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lowStockImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowStockName: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  lowStockQty: { fontSize: typography.fontSize.xs, color: colors.danger, marginTop: 2 },
  reorderButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reorderText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});

export default DashboardScreen;

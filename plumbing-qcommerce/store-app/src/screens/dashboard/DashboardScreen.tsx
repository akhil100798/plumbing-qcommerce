import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { RevenueCard, OrderSummaryCard, QuickActionCard } from '../../components/cards/DashboardCards';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchDashboardStart, fetchDashboardSuccess, fetchDashboardFailure } from '../../redux/slices/dashboardSlice';
import { analyticsService } from '../../services/analytics/analyticsService';
import { ordersService } from '../../services/orders/ordersService';
import { inventoryService } from '../../services/inventory/inventoryService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';

import WarehouseIcon from '../../assets/icons/warehouse.svg';
import NotificationIcon from '../../assets/icons/notification.svg';
import OrderIcon from '../../assets/icons/order.svg';
import PackingIcon from '../../assets/icons/packing.svg';
import ReadyPickupIcon from '../../assets/icons/ready-pickup.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import ProductAddIcon from '../../assets/icons/product-add.svg';
import StockUpdateIcon from '../../assets/icons/stock-update.svg';
import DispatchIcon from '../../assets/icons/dispatch.svg';
import PromotionIcon from '../../assets/icons/promotion.svg';
import LowStockIcon from '../../assets/icons/low-stock.svg';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';

export const DashboardScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const { todayRevenue, orderSummary, lowStockCount, error } = useAppSelector(state => state.dashboard);
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
        lowStockCount: lowStock.length,
      }));
    } catch (e: any) {
      dispatch(fetchDashboardFailure(e.message || 'Failed to sync dashboard'));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <WarehouseIcon width={24} height={24} stroke={colors.primary} style={{ marginRight: spacing.sm }} />
          <View>
            <Text style={styles.storeName}>{user?.fullName || user?.email || 'Store account'}</Text>
            <Text style={styles.storeStatus}>{error ? 'Staging data limited' : '● Connected'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <NotificationIcon width={20} height={20} stroke={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error && <Text style={styles.noticeText}>{error}</Text>}

        <RevenueCard amount={todayRevenue} percentageChange={12} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Orders Summary</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.gridRow}>
            <OrderSummaryCard
              label="New"
              count={orderSummary.newCount}
              color={colors.warning}
              icon={OrderIcon}
              onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
            />
            <OrderSummaryCard
              label="Packing"
              count={orderSummary.packingCount}
              color={colors.primary}
              icon={PackingIcon}
              onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
            />
          </View>
          <View style={[styles.gridRow, { marginTop: spacing.sm }]}>
            <OrderSummaryCard
              label="Ready"
              count={orderSummary.readyCount}
              color={colors.success}
              icon={ReadyPickupIcon}
              onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
            />
            <OrderSummaryCard
              label="Delivered"
              count={orderSummary.deliveredCount}
              color={colors.textSecondary}
              icon={SuccessCheckIcon}
              onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.md }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <View style={styles.gridRow}>
            <QuickActionCard
              label="Add Product"
              icon={ProductAddIcon}
              onPress={() => navigation.navigate('AddProduct')}
            />
            <QuickActionCard
              label="Update Stock"
              icon={StockUpdateIcon}
              onPress={() => navigation.navigate('Main', { screen: 'InventoryTab' })}
            />
          </View>
          <View style={[styles.gridRow, { marginTop: spacing.sm }]}>
            <QuickActionCard
              label="Dispatch Orders"
              icon={DispatchIcon}
              onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
            />
            <QuickActionCard
              label="Offers"
              icon={PromotionIcon}
              onPress={() => navigation.navigate('OffersPromotions')}
            />
          </View>
        </View>

        {lowStockCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => navigation.navigate('LowStockAlert')}
          >
            <View style={{ marginRight: spacing.sm }}>
              <LowStockIcon width={24} height={24} stroke={colors.danger} />
            </View>
            <View style={styles.alertTextWrapper}>
              <Text style={styles.alertTitle}>{lowStockCount} Products are low in stock</Text>
              <Text style={styles.alertSub}>Tap to review and restock immediately</Text>
            </View>
            <ArrowRightIcon width={16} height={16} stroke={colors.danger} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  storeName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  storeStatus: {
    fontSize: 10,
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
    marginTop: 1,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifEmoji: {
    fontSize: 16,
  },
  scroll: {
    padding: spacing.layout,
  },
  noticeText: {
    fontSize: typography.fontSize.xs,
    color: colors.danger,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  summaryGrid: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionsGrid: {
    width: '100%',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  alertEmoji: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.danger,
  },
  alertSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  alertArrow: {
    color: colors.danger,
    fontSize: 12,
  },
});
export default DashboardScreen;


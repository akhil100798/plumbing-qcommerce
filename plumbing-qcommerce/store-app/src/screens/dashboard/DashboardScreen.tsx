import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';

import NotificationIcon from '../../assets/icons/notification.svg';
import OrderIcon from '../../assets/icons/order.svg';
import PackingIcon from '../../assets/icons/packing.svg';
import ReadyPickupIcon from '../../assets/icons/ready-pickup.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import { RootState } from '../../redux/store';
import { inventoryService } from '../../services/inventory/inventoryService';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { storeService } from '../../services/store/storeService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { InventoryItem, MaterialRequest, Store } from '../../types';
import { AppStackParamList } from '../../types/navigation';

export function DashboardScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const user = useSelector((state: RootState) => state.auth.storeUser);

  const [store, setStore] = useState<Store | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const activeStore = await storeService.getCurrentStoreProfile();
      setStore(activeStore);

      const items = await inventoryService.getStoreInventory();
      setInventory(items || []);

      const matRequests = await materialRequestService.getStoreRequests();
      setRequests(matRequests || []);
    } catch {
      // transient fail handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Operational metrics calculations
  const pendingRequests = requests.filter(r => r.status === 'STORE_ACCEPTED' || r.status === 'APPROVED');
  const preparingRequests = requests.filter(r => r.status === 'PREPARING');
  const readyRequests = requests.filter(r => r.status === 'READY_FOR_PICKUP');
  const awaitingHandover = requests.filter(r => r.status === 'PLUMBER_AT_STORE');

  const lowStockItems = inventory.filter(i => (i.availableQuantity ?? i.quantity) <= 5);

  return (
    <SafeAreaView style={styles.container}>
      {/* Stitch Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hardware Store Partner</Text>
          <Text style={styles.storeName}>{store?.name || user?.fullName || 'Sharma Hardware Store'}</Text>
          {store?.address && <Text style={styles.addressText} numberOfLines={1}>📍 {store.address}</Text>}
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <NotificationIcon width={20} height={20} stroke={colors.textPrimary} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Fetching Store Operations...</Text>
          </View>
        ) : (
          <>
            {/* Stitch Today's Overview Card */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeaderRow}>
                <Text style={styles.overviewTitle}>Operations Overview</Text>
                <Text style={styles.overviewDate}>Live Store Feed</Text>
              </View>
              <View style={styles.overviewStatsRow}>
                <View style={styles.overviewStat}>
                  <View style={styles.statIconWrap}>
                    <OrderIcon width={16} height={16} stroke="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>{pendingRequests.length}</Text>
                  <Text style={styles.statLabel}>New Requests</Text>
                </View>
                <View style={styles.overviewStat}>
                  <View style={styles.statIconWrap}>
                    <PackingIcon width={16} height={16} stroke="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>{preparingRequests.length}</Text>
                  <Text style={styles.statLabel}>Preparing</Text>
                </View>
                <View style={styles.overviewStat}>
                  <View style={styles.statIconWrap}>
                    <ReadyPickupIcon width={16} height={16} stroke="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>{readyRequests.length}</Text>
                  <Text style={styles.statLabel}>Ready Pickup</Text>
                </View>
                <View style={styles.overviewStat}>
                  <View style={styles.statIconWrap}>
                    <SuccessCheckIcon width={16} height={16} stroke="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>{awaitingHandover.length}</Text>
                  <Text style={styles.statLabel}>At Counter</Text>
                </View>
              </View>
            </View>

            {/* Quick Action Navigation Grid */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Material Workflows</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'MaterialsTab' })}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statusGrid}>
              <TouchableOpacity
                style={styles.statusTile}
                onPress={() => navigation.navigate('Main', { screen: 'MaterialsTab' })}
              >
                <View style={[styles.statusIconWrap, { backgroundColor: colors.surfaceContainerLow }]}>
                  <OrderIcon width={20} height={20} stroke={colors.primary} />
                </View>
                <Text style={styles.statusLabel}>Incoming</Text>
                <Text style={styles.statusBadgeText}>{pendingRequests.length}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusTile}
                onPress={() => navigation.navigate('Main', { screen: 'MaterialsTab' })}
              >
                <View style={[styles.statusIconWrap, { backgroundColor: colors.warningLight }]}>
                  <PackingIcon width={20} height={20} stroke={colors.warning} />
                </View>
                <Text style={styles.statusLabel}>Packing</Text>
                <Text style={styles.statusBadgeText}>{preparingRequests.length}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusTile}
                onPress={() => navigation.navigate('Main', { screen: 'MaterialsTab' })}
              >
                <View style={[styles.statusIconWrap, { backgroundColor: '#E7F5FE' }]}>
                  <ReadyPickupIcon width={20} height={20} stroke="#2E9AE0" />
                </View>
                <Text style={styles.statusLabel}>Ready</Text>
                <Text style={styles.statusBadgeText}>{readyRequests.length}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusTile}
                onPress={() => navigation.navigate('Main', { screen: 'MaterialsTab' })}
              >
                <View style={[styles.statusIconWrap, { backgroundColor: colors.successLight }]}>
                  <SuccessCheckIcon width={20} height={20} stroke={colors.success} />
                </View>
                <Text style={styles.statusLabel}>Handover</Text>
                <Text style={styles.statusBadgeText}>{awaitingHandover.length}</Text>
              </TouchableOpacity>
            </View>

            {/* Inventory Alerts Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Inventory Stock Alerts</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'InventoryTab' })}>
                <Text style={styles.viewAll}>Manage Stock ({inventory.length})</Text>
              </TouchableOpacity>
            </View>

            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.lowStockCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lowStockName}>{item.productName || item.name || 'Hardware Component'}</Text>
                    <Text style={styles.lowStockQty}>Available: {item.availableQuantity ?? item.quantity} units</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => navigation.navigate('ProductDetails', { productId: item.id } as any)}
                  >
                    <Text style={styles.reorderText}>Update Stock</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>✓ All inventory items are adequately stocked.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  centerLoading: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.xs },
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
  greeting: { fontSize: typography.fontSize.xs, color: colors.textMuted },
  storeName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginTop: 2 },
  addressText: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
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
  scrollContent: { paddingBottom: spacing.giant },
  overviewCard: {
    marginHorizontal: spacing.layout,
    backgroundColor: colors.primaryContainer || colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overviewTitle: { color: '#FFFFFF', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  overviewDate: { color: 'rgba(255,255,255,0.75)', fontSize: typography.fontSize.xs },
  overviewStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewStat: { alignItems: 'center' },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.layout,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  viewAll: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primary },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.layout,
  },
  statusTile: {
    width: '23%',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusLabel: { fontSize: 11, color: colors.textPrimary, fontWeight: '600' },
  statusBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textMuted, marginTop: 2 },
  lowStockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    marginHorizontal: spacing.layout,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  lowStockName: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  lowStockQty: { fontSize: typography.fontSize.xs, color: colors.danger, marginTop: 2 },
  reorderButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reorderText: { color: colors.primary, fontSize: typography.fontSize.xs, fontWeight: '700' },
  emptyCard: {
    marginHorizontal: spacing.layout,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
  },
  emptyCardText: { fontSize: typography.fontSize.xs, color: colors.secondary || '#1B6D24', fontWeight: typography.fontWeight.bold },
});

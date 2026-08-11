import React, { useState, useEffect } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';

import { OrderCard } from '../components/cards/OrderCard';
import { colors, spacing, typography } from '../theme';
import { OrderRepository } from '../services/orders/orderRepository';
import { RootState } from '../redux/store';
import { setProductOrders, setServiceOrders } from '../redux/slices/ordersSlice';

interface DisplayOrderItem {
  id: number;
  displayId: string;
  title: string;
  price: number;
  date: string;
  status: string;
  type: 'product' | 'service';
  rawDate: string;
}

export function OrdersScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const user = useSelector((state: RootState) => state.auth.user);
  const productOrders = useSelector((state: RootState) => state.orders.productOrders);
  const serviceOrders = useSelector((state: RootState) => state.orders.serviceOrders);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFocused || !user?.id) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const [sOrders, pOrders] = await Promise.all([
          OrderRepository.getCustomerServiceOrders(user.id),
          OrderRepository.getCustomerProductOrders(),
        ]);
        dispatch(setServiceOrders(sOrders));
        dispatch(setProductOrders(pOrders));
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isFocused, user, dispatch]);

  const combinedOrders: DisplayOrderItem[] = [
    ...productOrders.map((o) => ({
      id: o.id,
      displayId: `PC-${o.id}`,
      title: 'Store Purchase',
      price: o.totalAmount,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent',
      status: o.status,
      type: 'product' as const,
      rawDate: o.createdAt || '',
    })),
    ...serviceOrders.map((o) => ({
      id: o.id,
      displayId: `SO-${o.id}`,
      title: o.description || 'Plumbing Service',
      price: o.totalCharge || o.baseCharge || 199,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent',
      status: o.status,
      type: 'service' as const,
      rawDate: o.createdAt || '',
    })),
  ];

  combinedOrders.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const isTerminalStatus = (status: string) =>
    status === 'COMPLETED' || status === 'CANCELLED' || status === 'DELIVERED';

  const filteredOrders = combinedOrders.filter((order) => {
    if (activeTab === 'active') return !isTerminalStatus(order.status);
    if (activeTab === 'completed') return order.status === 'COMPLETED' || order.status === 'DELIVERED';
    if (activeTab === 'cancelled') return order.status === 'CANCELLED';
    return true;
  });

  const handleOrderPress = (order: DisplayOrderItem) => {
    if (order.type === 'service' && !isTerminalStatus(order.status)) {
      navigation.navigate('PlumberTracking', { orderId: order.id });
    } else {
      navigation.navigate('OrderDetails', { orderId: order.id, type: order.type });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders & Services</Text>
      </View>

      <View style={styles.tabContainer}>
        {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : tab === 'completed' ? 'Completed' : 'Cancelled'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && filteredOrders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryContainer || colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab} orders found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              orderId={item.displayId}
              title={item.title}
              price={item.price}
              date={item.date}
              status={item.status}
              type={item.type}
              onPress={() => handleOrderPress(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primaryContainer || colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primaryContainer || colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  listContent: {
    padding: spacing.layout,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
  },
});

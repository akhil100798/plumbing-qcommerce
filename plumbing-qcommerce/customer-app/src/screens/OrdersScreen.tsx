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
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'services'>('all');
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

  // Sort by date desc
  combinedOrders.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const filteredOrders = combinedOrders.filter((order) => {
    if (activeTab === 'products') return order.type === 'product';
    if (activeTab === 'services') return order.type === 'service';
    return true;
  });

  const handleOrderPress = (order: DisplayOrderItem) => {
    if (order.type === 'service' && (order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS' || order.status === 'COMBINED_ORDER')) {
      navigation.navigate('OrderTracking', { orderId: order.id, type: 'service' });
    } else if (order.type === 'product' && (order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'OUT_FOR_DELIVERY')) {
      navigation.navigate('OrderTracking', { orderId: order.id, type: 'product' });
    } else {
      navigation.navigate('OrderDetails', { orderId: order.id, type: order.type });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Orders</Text>
      </View>

      <View style={styles.tabContainer}>
        {(['all', 'products', 'services'] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab === 'all' ? 'All' : tab === 'products' ? 'Products' : 'Services'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && filteredOrders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found.</Text>
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.layout,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
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
    fontSize: typography.fontSize.sm,
  },
});

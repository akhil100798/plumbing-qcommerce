import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { OrderCard } from '../../components/cards/OrderCards';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchOrdersStart, fetchOrdersSuccess, fetchOrdersFailure, updateOrderInSlice } from '../../redux/slices/ordersSlice';
import { ordersService } from '../../services/orders/ordersService';
import { NavigationProp, useNavigation, useIsFocused } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Order } from '../../types';

export const OrdersScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();
  
  const { newOrders, packingOrders, readyOrders, completedOrders, loading } = useAppSelector(state => state.orders);
  
  // Status tab selector: 'new' | 'packing' | 'ready' | 'done'
  const [activeTab, setActiveTab] = useState<'new' | 'packing' | 'ready' | 'done'>('new');

  const loadOrders = async () => {
    dispatch(fetchOrdersStart());
    try {
      const orders = await ordersService.getOrders();
      const nList = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
      const pList = orders.filter(o => o.status === 'PACKING');
      const rList = orders.filter(o => o.status === 'READY_FOR_PICKUP' || o.status === 'PACKED');
      const cList = orders.filter(o => o.status === 'DELIVERED' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'CANCELLED');
      
      dispatch(fetchOrdersSuccess({
        newOrders: nList,
        packingOrders: pList,
        readyOrders: rList,
        completedOrders: cList,
      }));
    } catch (e: any) {
      dispatch(fetchOrdersFailure(e.message || 'Failed to sync orders'));
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadOrders();
    }
  }, [isFocused]);

  const handleAction = async (order: Order) => {
    try {
      if (order.status === 'PENDING') {
        const updated = await ordersService.acceptOrder(order.id);
        dispatch(updateOrderInSlice(updated));
        Alert.alert('Order Accepted', `Order #ORD-${order.id} is accepted. Move to packing!`);
      } else if (order.status === 'CONFIRMED') {
        const updated = await ordersService.markPacking(order.id);
        dispatch(updateOrderInSlice(updated));
        navigation.navigate('Packing', { orderId: order.id });
      } else if (order.status === 'PACKING') {
        navigation.navigate('Packing', { orderId: order.id });
      } else if (order.status === 'READY_FOR_PICKUP' || order.status === 'PACKED') {
        navigation.navigate('ReadyForPickup', { orderId: order.id });
      }
    } catch (e: any) {
      Alert.alert('Action Failed', e.message || 'Unable to update status');
    }
  };

  const getActiveList = () => {
    switch (activeTab) {
      case 'new': return newOrders;
      case 'packing': return packingOrders;
      case 'ready': return readyOrders;
      case 'done': return completedOrders;
    }
  };

  const getActionTitle = (status: string) => {
    if (status === 'PENDING') return 'Accept Order';
    if (status === 'CONFIRMED') return 'Start Packing';
    if (status === 'PACKING') return 'Pack';
    if (status === 'READY_FOR_PICKUP' || status === 'PACKED') return 'Handover';
    return undefined;
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Orders" />
      
      {/* Custom Tabs */}
      <View style={styles.tabContainer}>
        {(['new', 'packing', 'ready', 'done'] as const).map((tab) => {
          const isActive = activeTab === tab;
          let count = 0;
          if (tab === 'new') count = newOrders.length;
          else if (tab === 'packing') count = packingOrders.length;
          else if (tab === 'ready') count = readyOrders.length;
          else if (tab === 'done') count = completedOrders.length;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.toUpperCase()}
              </Text>
              {count > 0 && (
                <View style={[styles.badge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={getActiveList()}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadOrders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            onActionPress={() => handleAction(item)}
            actionTitle={getActionTitle(item.status)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No orders in this state</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    height: 48,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: colors.primary,
  },
  badge: {
    paddingHorizontal: 5,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    minWidth: 16,
  },
  activeBadge: {
    backgroundColor: colors.primary,
  },
  inactiveBadge: {
    backgroundColor: colors.borderDark,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  activeBadgeText: {
    color: colors.card,
  },
  list: {
    padding: spacing.layout,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
});
export default OrdersScreen;

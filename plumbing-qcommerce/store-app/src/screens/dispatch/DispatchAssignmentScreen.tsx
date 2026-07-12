import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Alert } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { RiderCard } from '../../components/cards/DispatchCards';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { dispatchService } from '../../services/dispatch/dispatchService';
import { ordersService } from '../../services/orders/ordersService';
import { useAppDispatch } from '../../redux/store';
import { updateOrderInSlice } from '../../redux/slices/ordersSlice';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Rider, Order } from '../../types';

export const DispatchAssignmentScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'DispatchAssignment'>>();
  const dispatch = useAppDispatch();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const o = await ordersService.getOrderDetails(orderId);
      setOrder(o);
      const list = await dispatchService.getAvailableRiders();
      setRiders(list);
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve dispatch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orderId]);

  const handleAssign = async () => {
    if (!order || selectedRiderId === null) return;
    setLoading(true);
    try {
      const rider = await dispatchService.assignRider(order.id, selectedRiderId);
      // Re-read order details from service cache to update slice
      const updated = await ordersService.getOrderDetails(order.id);
      dispatch(updateOrderInSlice(updated));
      Alert.alert('Rider Dispatched', `${rider.fullName} assigned to order #ORD-${order.id}.`, [
        { text: 'OK', onPress: () => navigation.navigate('ReadyForPickup', { orderId: order.id }) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Rider assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Assign Rider" onBackPress={() => navigation.goBack()} />

      {order && (
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Assigning Rider For:</Text>
          <Text style={styles.summaryOrder}>#ORD-{order.id} • {order.customerName}</Text>
          <Text numberOfLines={1} style={styles.summaryAddress}>{order.address}</Text>
        </View>
      )}

      <Text style={styles.sectionHeader}>Select Rider</Text>

      <FlatList
        data={riders}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadData}
        renderItem={({ item }) => (
          <RiderCard
            rider={item}
            selected={selectedRiderId === item.id}
            onSelect={() => setSelectedRiderId(item.id)}
          />
        )}
      />

      <View style={styles.footer}>
        <PrimaryButton
          title="Assign Rider"
          onPress={handleAssign}
          disabled={selectedRiderId === null}
          loading={loading}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  orderSummary: {
    backgroundColor: colors.card,
    padding: spacing.md,
    margin: spacing.layout,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  summaryOrder: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  summaryAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginLeft: spacing.layout,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: spacing.layout,
  },
  footer: {
    padding: spacing.layout,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
export default DispatchAssignmentScreen;

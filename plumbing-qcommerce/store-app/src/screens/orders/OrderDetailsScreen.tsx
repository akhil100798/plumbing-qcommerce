import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { OrderItemCard } from '../../components/cards/OrderCards';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { ordersService } from '../../services/orders/ordersService';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { updateOrderInSlice } from '../../redux/slices/ordersSlice';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Order } from '../../types';

import PhoneIcon from '../../assets/icons/phone.svg';
import LocationIcon from '../../assets/icons/location-pin.svg';

export const OrderDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'OrderDetails'>>();
  const dispatch = useAppDispatch();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await ordersService.getOrderDetails(orderId);
      setOrder(data);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to retrieve order specifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [orderId]);

  const handleAccept = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const updated = await ordersService.acceptOrder(order.id);
      setOrder(updated);
      dispatch(updateOrderInSlice(updated));
      Alert.alert('Order Accepted', 'Order status updated. Ready to pack!', [
        { text: 'Go to Packing', onPress: () => navigation.navigate('Packing', { orderId: order.id }) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!order) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Reject',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const updated = await ordersService.rejectOrder(order.id);
              setOrder(updated);
              dispatch(updateOrderInSlice(updated));
              navigation.navigate('Main', { screen: 'OrdersTab' });
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Operation failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!order) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading details...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Order Details" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Customer Details</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              {order.customerPhone && (
                <TouchableOpacity onPress={() => Alert.alert('Call customer', `Calling ${order.customerPhone}`)}>
                  <PhoneIcon width={16} height={16} stroke={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.customerAddress}>{order.address || 'Address not specified'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs }}>
              <LocationIcon width={14} height={14} stroke={colors.textSecondary} />
              <Text style={styles.distanceText}>2.4 km away</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Order Items</Text>
          <View style={styles.itemsCard}>
            {order.items.map((item, idx) => (
              <OrderItemCard key={idx} item={item} />
            ))}
          </View>
        </View>

        <View style={styles.billingSection}>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Total Items</Text>
            <Text style={styles.billingValue}>{order.items.length}</Text>
          </View>
          <View style={[styles.billingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {order.status === 'PENDING' && (
        <View style={styles.buttonContainer}>
          <SecondaryButton
            title="Reject"
            onPress={handleReject}
            style={styles.actionBtn}
          />
          <PrimaryButton
            title="Accept Order"
            onPress={handleAccept}
            style={[styles.actionBtn, { marginLeft: spacing.md }]}
            loading={loading}
          />
        </View>
      )}

      {order.status === 'CONFIRMED' && (
        <View style={styles.singleBtnContainer}>
          <PrimaryButton
            title="Start Packing"
            onPress={() => navigation.navigate('Packing', { orderId: order.id })}
            style={styles.largeBtn}
          />
        </View>
      )}

      {order.status === 'PACKING' && (
        <View style={styles.singleBtnContainer}>
          <PrimaryButton
            title="Resume Packing"
            onPress={() => navigation.navigate('Packing', { orderId: order.id })}
            style={styles.largeBtn}
          />
        </View>
      )}

      {(order.status === 'READY_FOR_PICKUP' || order.status === 'PACKED') && (
        <View style={styles.singleBtnContainer}>
          <PrimaryButton
            title="Handover Package"
            onPress={() => navigation.navigate('ReadyForPickup', { orderId: order.id })}
            style={styles.largeBtn}
          />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  scroll: {
    padding: spacing.layout,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  customerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  customerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  phoneEmoji: {
    fontSize: 16,
    color: colors.primary,
  },
  customerAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
  },
  itemsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  billingSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.giant,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  billingLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  billingValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: spacing.layout,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
  },
  singleBtnContainer: {
    padding: spacing.layout,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  largeBtn: {
    width: '100%',
  },
});
export default OrderDetailsScreen;

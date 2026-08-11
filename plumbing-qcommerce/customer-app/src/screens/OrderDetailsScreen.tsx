import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { colors, spacing, typography, borderRadius } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { OrderRepository } from '../services/orders/orderRepository';

type Props = StackScreenProps<AppStackParamList, 'OrderDetails'>;

export function OrderDetailsScreen({ route, navigation }: Props) {
  const { orderId, type } = route.params as { orderId: number; type: 'product' | 'service' };
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        if (type === 'product') {
          const details = await OrderRepository.getProductOrderDetails(orderId);
          setOrder(details);
        } else {
          const details = await OrderRepository.getServiceOrderById(orderId);
          setOrder(details);
        }
      } catch (err) {
        console.error('Failed to fetch order details', err);
        Alert.alert('Error', 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, type]);

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Service Booking',
      'Are you sure you want to cancel this service request?',
      [
        { text: 'No, Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const updated = await OrderRepository.cancelServiceOrder(orderId);
              setOrder(updated);
              Alert.alert('Booking Cancelled', 'Your service booking has been cancelled.');
            } catch (err: any) {
              Alert.alert('Cancellation Failed', err?.message || 'Could not cancel booking.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryContainer || colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Order not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isProduct = type === 'product';
  const displayId = isProduct ? `PC-${order.id}` : `SO-${order.id}`;
  const status = order.status || 'PENDING';
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recent';

  const items = isProduct ? (order.items || []) : [];
  const itemTotal = isProduct 
    ? items.reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity), 0)
    : 0;
  const deliveryFee = isProduct ? 25 : 0;
  const handlingFee = isProduct ? 10 : 0;
  const grandTotal = isProduct ? (order.totalAmount || (itemTotal + deliveryFee + handlingFee)) : (order.totalCharge || order.totalAmount || 199);

  const isCancellable = !isProduct && (status === 'PENDING' || status === 'SEARCHING' || status === 'ASSIGNED');
  const isCompletedService = !isProduct && status === 'COMPLETED';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Order Status</Text>
          <Text
            style={[
              styles.statusValue,
              status === 'CANCELLED'
                ? styles.statusCancelled
                : status === 'COMPLETED' || status === 'DELIVERED'
                ? styles.statusDelivered
                : styles.statusActive,
            ]}
          >
            {status}
          </Text>
          <Text style={styles.orderMetaText}>Order ID: #{displayId}</Text>
          <Text style={styles.orderMetaText}>Placed on: {dateStr}</Text>
          {isProduct && order.storeName && (
            <Text style={styles.orderMetaText}>Store: {order.storeName}</Text>
          )}
        </View>

        {!isProduct && order.plumber && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ASSIGNED PLUMBER</Text>
            <View style={styles.card}>
              <Text style={styles.addressName}>{order.plumber.fullName || order.plumber.name}</Text>
              {order.plumber.phone && (
                <Text style={styles.addressLine}>Phone: {order.plumber.phone}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SERVICE / ORDER DETAILS</Text>
          <View style={styles.card}>
            <Text style={styles.addressName}>
              {isProduct ? 'Standard Home Delivery' : order.description || 'Plumbing Service Job'}
            </Text>
            <Text style={styles.addressLine}>
              {isProduct ? 'Dispatched from Hardware Store' : 'Assigned Expert Visit'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{isProduct ? 'ITEMS ORDERED' : 'SERVICE DETAIL'}</Text>
          <View style={styles.card}>
            {isProduct ? (
              items.map((item: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                </View>
              ))
            ) : (
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{order.description || 'Plumbing Service'}</Text>
                  <Text style={styles.itemQty}>Standard Repair</Text>
                </View>
                <Text style={styles.itemPrice}>₹{order.totalCharge || order.baseCharge || 199}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COST SUMMARY</Text>
          <View style={styles.card}>
            {!isProduct && (
              <>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Base Charge</Text>
                  <Text style={styles.billValue}>₹{order.baseCharge || 199}</Text>
                </View>
                {!!order.laborCharge && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Labor Charge</Text>
                    <Text style={styles.billValue}>₹{order.laborCharge}</Text>
                  </View>
                )}
                {!!order.partsCharge && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Parts Charge</Text>
                    <Text style={styles.billValue}>₹{order.partsCharge}</Text>
                  </View>
                )}
              </>
            )}
            <View style={[styles.billRow, styles.billRowTotal]}>
              <Text style={styles.billTotalLabel}>Total Amount</Text>
              <Text style={styles.billTotalValue}>₹{grandTotal}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isCancellable && (
          <PrimaryButton
            title="Cancel Booking"
            onPress={handleCancelOrder}
            style={[styles.actionBtn, { backgroundColor: colors.error || '#BA1A1A' }]}
          />
        )}
        {isCompletedService && (
          <PrimaryButton
            title="Rate Service Experience"
            onPress={() => navigation.navigate('ServiceCompletion', { orderId: order.id, plumberName: order.plumber?.fullName || 'Plumber' })}
            style={styles.actionBtn}
          />
        )}
        {!isCancellable && !isCompletedService && (
          <PrimaryButton
            title="Need Help / Support"
            onPress={() => Alert.alert('Support Requested', 'Our team will contact you shortly.')}
            style={styles.actionBtn}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background || '#F8F9FF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background || '#F8F9FF',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  statusCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  statusActive: {
    color: colors.primaryContainer || colors.primary,
  },
  statusDelivered: {
    color: colors.success || '#006E1C',
  },
  statusCancelled: {
    color: colors.error || '#BA1A1A',
  },
  orderMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  addressName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  itemQty: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  billLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
  },
  billValue: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
  },
  billRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  billTotalLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  billTotalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.primaryContainer || colors.primary,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  actionBtn: {
    width: '100%',
  },
});

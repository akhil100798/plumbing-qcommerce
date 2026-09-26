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
import { colors, spacing, typography } from '../theme';
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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

  // For products:
  const items = isProduct ? (order.items || []) : [];
  const itemTotal = isProduct 
    ? items.reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity), 0)
    : 0;
  const deliveryFee = isProduct ? 25 : 0;
  const handlingFee = isProduct ? 10 : 0;
  const grandTotal = isProduct ? (order.totalAmount || (itemTotal + deliveryFee + handlingFee)) : order.totalAmount;

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
          <Text style={[styles.statusValue, status === 'CANCELLED' ? styles.statusCancelled : styles.statusDelivered]}>
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
              <Text style={styles.addressName}>{order.plumber.fullName}</Text>
              <Text style={styles.addressLine}>Phone: {order.plumber.phone}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DELIVERY / SERVICE DETAILS</Text>
          <View style={styles.card}>
            <Text style={styles.addressName}>Customer Contact</Text>
            <Text style={styles.addressLine}>
              {isProduct ? 'Standard Home Delivery' : order.description || 'Plumbing Service Job'}
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
                <Text style={styles.itemPrice}>₹{order.totalAmount || 199}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>BILL DETAILS</Text>
          <View style={styles.card}>
            {isProduct ? (
              <>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item Total</Text>
                  <Text style={styles.billValue}>₹{itemTotal}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  <Text style={styles.billValue}>₹{deliveryFee}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Handling Fee</Text>
                  <Text style={styles.billValue}>₹{handlingFee}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Base Charge</Text>
                  <Text style={styles.billValue}>₹{order.baseCharge || 199}</Text>
                </View>
                {order.laborCharge && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Labor Charge</Text>
                    <Text style={styles.billValue}>₹{order.laborCharge}</Text>
                  </View>
                )}
                {order.partsCharge && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Parts Charge</Text>
                    <Text style={styles.billValue}>₹{order.partsCharge}</Text>
                  </View>
                )}
                {order.platformFee && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Platform Fee</Text>
                    <Text style={styles.billValue}>₹{order.platformFee}</Text>
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
        <PrimaryButton
          title={status === 'CANCELLED' ? 'Reorder Items' : 'Get Help / Support'}
          onPress={() => {
            Alert.alert('Action Triggered', 'Our team will support your request shortly.');
          }}
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  statusDelivered: {
    color: colors.success,
  },
  statusCancelled: {
    color: colors.error,
  },
  orderMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: spacing.md,
    padding: spacing.md,
  },
  addressName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  itemQty: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  billLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  billValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  billRowTotal: {
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  billTotalLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  billTotalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionBtn: {
    width: '100%',
  },
});

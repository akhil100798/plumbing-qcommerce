import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { addToCart, removeFromCart } from '../redux/slices/cartSlice';
import { RootState } from '../redux/store';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [coupon, setCoupon] = useState('');

  const staticProductDetails: { [key: number]: { name: string; price: number; specs: string } } = {
    101: { name: 'Ashirvad PVC Pipe', price: 220, specs: '(20mm) 3 Meter' },
    102: { name: 'CPVC Elbow 90°', price: 50, specs: '(20mm)' },
    103: { name: 'Teflon Tape', price: 20, specs: 'Standard' },
  };

  const items = Object.entries(cartItems).map(([id, qty]) => {
    const productId = parseInt(id);
    const detail = staticProductDetails[productId] || { name: `Product ${productId}`, price: 100, specs: '' };
    return {
      id: productId,
      name: detail.name,
      price: detail.price,
      qty,
      specs: detail.specs,
    };
  });

  const updateQty = (id: number, delta: number) => {
    if (delta > 0) {
      dispatch(addToCart(id));
    } else {
      dispatch(removeFromCart(id));
    }
  };

  const handleApplyCoupon = () => {
    if (!coupon.trim()) return;
    Alert.alert('Coupon Applied', `Code "${coupon.toUpperCase()}" successfully applied!`);
  };

  // Calculations
  const itemTotal = items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  const deliveryFee = itemTotal > 0 ? 25 : 0;
  const handlingFee = itemTotal > 0 ? 10 : 0;
  const grandTotal = itemTotal + deliveryFee + handlingFee;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>My Cart</Text>
          <Text style={styles.subtitle}>{items.length} items</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.deliveryBanner}>
          <View>
            <Text style={styles.deliveryLabel}>Delivering to</Text>
            <Text style={styles.deliveryAddress}>Home - 500081</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemImagePlaceholder}>
                <Text style={styles.itemIcon}>⚙️</Text>
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemSpecs}>{item.specs}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>

              <View style={styles.qtyController}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.couponSection}>
          <TextInput
            style={styles.couponInput}
            placeholder="Apply Coupon"
            placeholderTextColor={colors.textMuted}
            value={coupon}
            onChangeText={setCoupon}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.couponBtn} onPress={handleApplyCoupon}>
            <Text style={styles.couponBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.billDetailsCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
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
          <View style={[styles.billRow, styles.billRowTotal]}>
            <Text style={styles.billTotalLabel}>To Pay</Text>
            <Text style={styles.billTotalValue}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Proceed to Checkout"
          onPress={() => navigation.navigate('Address', { totalAmount: grandTotal })}
          disabled={items.length === 0}
          style={styles.checkoutBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  deliveryBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  deliveryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  deliveryAddress: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  changeBtnText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  itemsList: {
    marginBottom: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemIcon: {
    fontSize: 22,
  },
  itemDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  itemSpecs: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: 4,
  },
  qtyController: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  qtyText: {
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  couponSection: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  couponBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1.5,
    borderLeftColor: colors.border,
  },
  couponBtnText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  billDetailsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  billTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
    marginBottom: 0,
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
  checkoutBtn: {
    width: '100%',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useCart } from '../../services/cartService';
import { useAuth } from '../../services/authService';
import { useOrders } from '../../services/orderService';
import {
  ChevronLeftIcon,
  LocationPinIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '../../assets/svg/Icons';

interface CheckoutScreenProps {
  onBack: () => void;
  onPaymentSuccess: (orderId: string) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onBack,
  onPaymentSuccess,
}) => {
  const { items, subtotal, discount, tax, visitingFee, total, clearCart } = useCart();
  const { selectedAddress } = useAuth();
  const { createOrderFromCart } = useOrders();

  const [selectedSlot, setSelectedSlot] = useState('Express (Within 45 Mins)');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const slots = [
    { id: 'express', label: 'Express (Within 45 Mins)', sub: 'Fastest response' },
    { id: 'today_afternoon', label: 'Today, 02:00 PM - 04:00 PM', sub: 'Standard' },
    { id: 'today_evening', label: 'Today, 05:00 PM - 07:00 PM', sub: 'Standard' },
  ];

  const paymentOptions = [
    { id: 'cod', name: 'Pay After Service (Cash / QR)', icon: '💵', tag: 'Recommended' },
    { id: 'upi', name: 'Google Pay / PhonePe / Paytm (UPI)', icon: '⚡', tag: 'Instant' },
    { id: 'card', name: 'Credit / Debit Card', icon: '💳', tag: 'Safe' },
  ];

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add a service or product first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const fullAddress = selectedAddress.addressLine ||
      `${selectedAddress.flat}, ${selectedAddress.area}, ${selectedAddress.city} - ${selectedAddress.pincode}`;
    const selectedPayName = paymentOptions.find((p) => p.id === paymentMethod)?.name || 'Pay After Service';

    try {
      const created = await createOrderFromCart(
        items,
        subtotal,
        discount,
        tax,
        visitingFee,
        total,
        fullAddress,
        selectedPayName,
        { latitude: 12.9141, longitude: 77.6411 }
      );

      clearCart();
      onPaymentSuccess(created.id);
    } catch (err: any) {
      console.error('Failed to create service order:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back button">
          <ChevronLeftIcon size={22} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Payment</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LocationPinIcon size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Service Address</Text>
          </View>
          <Text style={styles.addressName}>{selectedAddress.name} • {selectedAddress.phone}</Text>
          <Text style={styles.addressDetails}>
            {selectedAddress.addressLine || `${selectedAddress.flat}, ${selectedAddress.area}, ${selectedAddress.city} - ${selectedAddress.pincode}`}
          </Text>
        </View>

        {/* Arrival Slot */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ClockIcon size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Plumber Arrival Slot</Text>
          </View>

          {slots.map((slot) => {
            const isSelected = selectedSlot === slot.label;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotOption, isSelected && styles.selectedSlotOption]}
                onPress={() => setSelectedSlot(slot.label)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View style={styles.slotRadio}>
                  {isSelected && <View style={styles.slotRadioInner} />}
                </View>
                <View style={styles.slotInfo}>
                  <Text style={[styles.slotLabel, isSelected && styles.selectedSlotLabel]}>
                    {slot.label}
                  </Text>
                  <Text style={styles.slotSub}>{slot.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          {paymentOptions.map((opt) => {
            const isSelected = paymentMethod === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.payOption, isSelected && styles.selectedPayOption]}
                onPress={() => setPaymentMethod(opt.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.payIcon}>{opt.icon}</Text>
                <View style={styles.payInfo}>
                  <Text style={[styles.payName, isSelected && styles.selectedPayName]}>
                    {opt.name}
                  </Text>
                  <Text style={styles.payTag}>{opt.tag}</Text>
                </View>
                <View style={styles.payRadio}>
                  {isSelected && <View style={styles.slotRadioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Error Message if any */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Order Summary Recap */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Payable</Text>
            <Text style={styles.summaryValue}>₹{total}</Text>
          </View>
          <View style={styles.assuranceRow}>
            <ShieldCheckIcon size={16} color={colors.success} />
            <Text style={styles.assuranceText}>
              Backed by FixKart 60-Day Satisfaction Warranty
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPayLabel}>Amount to Pay</Text>
          <Text style={styles.bottomPayAmount}>₹{total}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payBtn, (isSubmitting || items.length === 0) && styles.disabledPayBtn]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting || items.length === 0}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Book and Dispatch Plumber"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.payBtnText}>Book & Dispatch Plumber</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginLeft: 6,
  },
  addressName: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.onBackground,
    marginBottom: 2,
  },
  addressDetails: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondary,
    lineHeight: 16,
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    padding: spacing.sm + 2,
    borderRadius: 12,
    marginBottom: spacing.xs + 2,
  },
  selectedSlotOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  slotRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  slotRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary,
  },
  slotInfo: {
    flex: 1,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onBackground,
  },
  selectedSlotLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  slotSub: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 1,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    padding: spacing.sm + 4,
    borderRadius: 12,
    marginBottom: spacing.xs + 4,
  },
  selectedPayOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  payIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  payInfo: {
    flex: 1,
  },
  payName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onBackground,
  },
  selectedPayName: {
    color: colors.primary,
    fontWeight: '700',
  },
  payTag: {
    fontSize: 10,
    color: colors.secondary,
  },
  payRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: colors.errorContainer,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  summaryTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    fontWeight: '400',
    color: colors.onBackground,
  },
  summaryValue: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  assuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    padding: 8,
    borderRadius: 8,
  },
  assuranceText: {
    fontSize: 11,
    color: colors.onSuccess,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPayLabel: {
    fontSize: 10,
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  bottomPayAmount: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.onBackground,
  },
  payBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledPayBtn: {
    backgroundColor: colors.outlineVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  payBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.onPrimary,
  },
});

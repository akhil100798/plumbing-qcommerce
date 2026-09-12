import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useOrders } from '../../services/orderService';
import { CheckCircleIcon, ShieldCheckIcon } from '../../assets/svg/Icons';

export interface PaymentSuccessScreenProps {
  orderId: string;
  onTrackOrder: (orderId: string) => void;
  onGoHome: () => void;
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({
  orderId,
  onTrackOrder,
  onGoHome,
}) => {
  const { getOrderById } = useOrders();
  const order = getOrderById(orderId);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <CheckCircleIcon size={72} color={colors.success} />
        </View>

        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.orderNumber}>
          Order ID: {order?.orderNumber || `FK-${orderId}`}
        </Text>

        <Text style={styles.subtitle}>
          Your plumbing service has been scheduled.
          {order?.plumber?.name
            ? ` Plumber ${order.plumber.name} has accepted and is preparing to travel to your location.`
            : ' Locating and dispatching the nearest certified plumber to your location.'}
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Arrival Time</Text>
            <Text style={styles.summaryVal}>Within 30–45 Mins</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryVal}>₹{order?.total || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment</Text>
            <Text style={styles.summaryVal}>{order?.paymentMethod || 'Confirmed'}</Text>
          </View>
        </View>

        <View style={styles.guaranteeBox}>
          <ShieldCheckIcon size={20} color={colors.primary} />
          <Text style={styles.guaranteeText}>
            Covered under FixKart 60-day repair warranty & guarantee.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => onTrackOrder(orderId)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Live Track Plumber"
        >
          <Text style={styles.trackBtnText}>Live Track Plumber</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={onGoHome}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.onBackground,
    marginBottom: 4,
  },
  orderNumber: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondary,
  },
  summaryVal: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.onBackground,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    padding: spacing.md,
    borderRadius: 12,
    width: '100%',
  },
  guaranteeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    width: '100%',
  },
  trackBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  trackBtnText: {
    fontFamily: typography.button.fontFamily,
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  homeBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnText: {
    fontFamily: typography.button.fontFamily,
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

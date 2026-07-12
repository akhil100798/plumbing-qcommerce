import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { StatusChip } from '../common/StatusChip';
import { Order, OrderItem } from '../../types';
import OrderBoxIcon from '../../assets/icons/order-box.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';

// ==========================================
// ORDER CARD (LIST VIEW)
// ==========================================
interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onActionPress?: () => void;
  actionTitle?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  onActionPress,
  actionTitle,
}) => {
  const itemsDescription = order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>#ORD-{order.id}</Text>
          <Text style={styles.customerName}>{order.customerName}</Text>
        </View>
        <StatusChip status={order.status} />
      </View>
      
      <Text numberOfLines={1} style={styles.itemsSummary}>
        {itemsDescription}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.billingInfo}>
          <Text style={styles.totalLabel}>Amount</Text>
          <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
        </View>

        {onActionPress && actionTitle && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onActionPress();
            }}
          >
            <Text style={styles.actionText}>{actionTitle}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// ORDER ITEM CARD (DETAILS VIEW)
// ==========================================
interface OrderItemCardProps {
  item: OrderItem;
}


export const OrderItemCard: React.FC<OrderItemCardProps> = ({ item }) => {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemBullet}>
        <OrderBoxIcon width={18} height={18} stroke={colors.primary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString()}</Text>
    </View>
  );
};

// ==========================================
// PACKING ITEM CARD (CHECKLIST VIEW)
// ==========================================
interface PackingItemCardProps {
  item: OrderItem;
  isPacked: boolean;
  onTogglePack: () => void;
}


export const PackingItemCard: React.FC<PackingItemCardProps> = ({
  item,
  isPacked,
  onTogglePack,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.packingCard, isPacked && styles.packedCard]}
      onPress={onTogglePack}
    >
      <View style={styles.packingLeft}>
        <View style={[styles.checkbox, isPacked && styles.checkedBox]}>
          {isPacked && <SuccessCheckIcon width={12} height={12} stroke={colors.card} />}
        </View>
        <View style={styles.packingDetails}>
          <Text style={[styles.packingName, isPacked && styles.packedText]}>
            {item.productName}
          </Text>
          <Text style={styles.packingQty}>Quantity: {item.quantity}</Text>
        </View>
      </View>
      <Text style={styles.statusLabel}>{isPacked ? 'Packed' : 'Pending'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  orderId: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  customerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  itemsSummary: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginVertical: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingInfo: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: colors.card,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  
  // OrderItemCard
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemBullet: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bulletText: {
    fontSize: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  itemStyle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemQty: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },

  // PackingItemCard
  packingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  packedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: colors.success,
  },
  packingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.xs,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkedBox: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '900',
  },
  packingDetails: {
    flex: 1,
  },
  packingName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  packedText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  packingQty: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
});

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { SvgEcommercePackage, SvgNavigationArrowRight, SvgPlumbingWrench } from '../../assets/svg';

interface OrderCardProps {
  orderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'PAID' | 'CANCELLED' | string;
  price: number;
  date: string;
  type: 'product' | 'service';
  title: string;
  onPress: () => void;
}

export function OrderCard({
  orderId,
  status,
  price,
  date,
  type,
  title,
  onPress,
}: OrderCardProps) {
  const isProduct = type === 'product';

  const getStatusColor = (val: string) => {
    switch (val.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'PAID':
        return { bg: '#DCFCE7', text: '#059669', border: '#059669' };
      case 'PENDING':
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return { bg: '#DBEAFE', text: '#2563EB', border: '#2563EB' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' };
      default:
        return { bg: '#F1F5F9', text: colors.textSecondary, border: '#CBD5E1' };
    }
  };

  const statusColors = getStatusColor(status);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {/* Top Accent Bar */}
      <View style={[styles.accentBar, { backgroundColor: statusColors.border }]} />

      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            {isProduct ? <SvgEcommercePackage width={18} height={18} stroke={colors.primary} /> : <SvgPlumbingWrench width={18} height={18} stroke={colors.primary} />}
          </View>
          <View>
            <View style={styles.orderIdRow}>
              <Text style={styles.orderId}>#{orderId}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {isProduct ? 'Spares Kit' : 'Plumbing Job'}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>{date} • FixKart Verified</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Total:</Text>
          <Text style={styles.priceValue}>₹{price}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={styles.viewDetailsText}>View Details & Tracking</Text><SvgNavigationArrowRight width={14} height={14} stroke={colors.primary} style={{ marginLeft: 4 }} /></View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 18,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  cardFooter: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});

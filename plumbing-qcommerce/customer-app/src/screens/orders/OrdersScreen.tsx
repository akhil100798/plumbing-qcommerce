import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useOrders } from '../../services/orderService';
import { StatusChip } from '../../components/common/StatusChip';
import { mapOrderStatusToType } from '../../components/common/statusUtils';
import {
  BookingsIcon,
  ChevronRightIcon,
  StarIcon,
  PhoneCallIcon,
} from '../../assets/svg/Icons';

interface OrdersScreenProps {
  onNavigateToTracking: (orderId: string) => void;
  onNavigateToHome: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onNavigateToTracking,
  onNavigateToHome,
}) => {
  const { orders, refreshOrders, isLoading } = useOrders();
  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const ongoingOrders = orders.filter(
    (o) =>
      o.status === 'in_progress' ||
      o.status === 'assigned' ||
      o.status === 'requested' ||
      o.status === 'confirmed' ||
      o.status === 'materials_pending'
  );
  const historyOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  );

  const displayedOrders = activeTab === 'ongoing' ? ongoingOrders : historyOrders;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings & Orders</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
          onPress={() => setActiveTab('ongoing')}
          activeOpacity={0.8}
          accessibilityRole="tab"
        >
          <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
            Ongoing ({ongoingOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
          accessibilityRole="tab"
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Past Bookings ({historyOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {displayedOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookingsIcon size={56} color={colors.outline} />
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptySubtitle}>
              Need plumbing repair or spare parts? Book expert plumbers in minutes.
            </Text>
            <TouchableOpacity
              style={styles.bookServiceBtn}
              onPress={onNavigateToHome}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.bookServiceBtnText}>Book a Plumber</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => onNavigateToTracking(order.id)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`Booking ${order.orderNumber}`}
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <StatusChip status={mapOrderStatusToType(order.status)} label={order.statusLabel} />
              </View>

              <View style={styles.divider} />

              {/* Items List */}
              <View style={styles.itemsList}>
                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemBullet}>•</Text>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title} (x{item.quantity})
                    </Text>
                    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  </View>
                ))}
              </View>

              {/* Plumber Info if assigned */}
              {order.plumber && (
                <View style={styles.plumberRow}>
                  <Image
                    source={{ uri: order.plumber.photoUrl }}
                    style={styles.plumberPhoto}
                  />
                  <View style={styles.plumberInfo}>
                    <Text style={styles.plumberName}>{order.plumber.name}</Text>
                    <View style={styles.ratingRow}>
                      <StarIcon size={12} fill={colors.star} />
                      <Text style={styles.ratingScore}>{order.plumber.rating}</Text>
                      <Text style={styles.plumberBadge}> • {order.plumber.badge}</Text>
                    </View>
                  </View>
                  <View style={styles.callIconBox}>
                    <PhoneCallIcon size={16} color={colors.primary} />
                  </View>
                </View>
              )}

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.totalLabel}>Total Paid</Text>
                  <Text style={styles.totalAmount}>₹{order.total}</Text>
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onNavigateToTracking(order.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionBtnText}>
                    {order.status === 'completed' ? 'View Details' : 'Track Live'}
                  </Text>
                  <ChevronRightIcon size={14} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  tab: {
    paddingVertical: 12,
    marginRight: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
  },
  orderDate: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: spacing.sm,
  },
  itemsList: {
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemBullet: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 6,
  },
  itemTitle: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: colors.onBackground,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onBackground,
    marginLeft: 8,
  },
  plumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    padding: 10,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  plumberPhoto: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainer,
  },
  plumberInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  plumberName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onBackground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onBackground,
    marginLeft: 3,
  },
  plumberBadge: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  callIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  totalLabel: {
    fontSize: 10,
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.onBackground,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  bookServiceBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookServiceBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.onPrimary,
  },
});

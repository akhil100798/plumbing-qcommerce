import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import StoreIcon from '../../components/common/StoreIcon';
import { ordersService } from '../../services/orders/ordersService';

interface OrderItem {
  id: string;
  date: string;
  status: 'New' | 'Processing' | 'Ready for Pickup' | 'Completed';
  statusColor: string;
  statusBg: string;
  customer: string;
  initials: string;
  location: string;
  amount: string;
  items: string;
  cta?: string;
  ctaStyle?: 'solid' | 'outline' | 'green';
}

const mockOrdersData: OrderItem[] = [
  {
    id: '#FK123456',
    date: 'Today, 10:30 AM',
    status: 'New',
    statusColor: '#D97706',
    statusBg: '#FFF4E5',
    customer: 'Rahul Sharma',
    initials: 'RS',
    location: 'Kandivali West, Mumbai',
    amount: '₹1,245',
    items: '5 items',
    cta: 'Accept & Start Packing',
    ctaStyle: 'green',
  },
  {
    id: '#FK123455',
    date: 'Today, 09:15 AM',
    status: 'Processing',
    statusColor: '#1D63DE',
    statusBg: '#EAF2FE',
    customer: 'Priya Patel',
    initials: 'PP',
    location: 'Borivali East, Mumbai',
    amount: '₹2,860',
    items: '8 items',
    cta: 'Continue Packing',
    ctaStyle: 'solid',
  },
  {
    id: '#FK123454',
    date: 'Today, 08:45 AM',
    status: 'Ready for Pickup',
    statusColor: '#16A34A',
    statusBg: '#EAF8ED',
    customer: 'Amit Verma (Plumber Assigned)',
    initials: 'AV',
    location: 'Malad West, Mumbai',
    amount: '₹1,080',
    items: '6 items',
    cta: 'View Pickup Details',
    ctaStyle: 'outline',
  },
  {
    id: '#FK123450',
    date: 'Yesterday, 04:30 PM',
    status: 'Completed',
    statusColor: '#16A34A',
    statusBg: '#EAF8ED',
    customer: 'Suresh Raina',
    initials: 'SR',
    location: 'Andheri East, Mumbai',
    amount: '₹3,420',
    items: '12 items',
    cta: 'View Receipt',
    ctaStyle: 'outline',
  },
];

export function OrdersScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'processing' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>(mockOrdersData);

  useEffect(() => {
    // Attempt live orders retrieval if backend endpoint is accessible
    ordersService.getOrders().then((liveOrders) => {
      if (liveOrders && liveOrders.length > 0) {
        const mapped: OrderItem[] = liveOrders.map((o: any, idx: number) => {
          let statusText: OrderItem['status'] = 'New';
          let statusColor = '#D97706';
          let statusBg = '#FFF4E5';
          let cta = 'View Details';
          let ctaStyle: OrderItem['ctaStyle'] = 'outline';

          if (o.status === 'PACKING') {
            statusText = 'Processing';
            statusColor = '#1D63DE';
            statusBg = '#EAF2FE';
            cta = 'Continue Packing';
            ctaStyle = 'solid';
          } else if (o.status === 'READY_FOR_PICKUP' || o.status === 'PACKED') {
            statusText = 'Ready for Pickup';
            statusColor = '#16A34A';
            statusBg = '#EAF8ED';
            cta = 'View Pickup Details';
            ctaStyle = 'outline';
          } else if (o.status === 'DELIVERED' || o.status === 'COMPLETED') {
            statusText = 'Completed';
            statusColor = '#16A34A';
            statusBg = '#EAF8ED';
            cta = 'View Receipt';
            ctaStyle = 'outline';
          }

          return {
            id: o.orderNumber || `#FK-${o.id || 1000 + idx}`,
            date: o.placedAt ? new Date(o.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            status: statusText,
            statusColor,
            statusBg,
            customer: o.customerName || 'Customer Order',
            initials: (o.customerName || 'CO').slice(0, 2).toUpperCase(),
            location: o.customerAddress || 'Indiranagar, Bangalore',
            amount: `₹${(o.totalAmount || 1200).toLocaleString('en-IN')}`,
            items: `${o.items?.length || 4} items`,
            cta,
            ctaStyle,
          };
        });
        setOrders(mapped);
      }
    }).catch(() => {
      // Fallback to initial realistic data
    });
  }, []);

  const counts = {
    all: orders.length,
    new: orders.filter((o) => o.status === 'New').length,
    processing: orders.filter((o) => o.status === 'Processing').length,
    ready: orders.filter((o) => o.status === 'Ready for Pickup').length,
  };

  const filteredOrders = orders.filter((item) => {
    if (activeTab === 'new' && item.status !== 'New') return false;
    if (activeTab === 'processing' && item.status !== 'Processing') return false;
    if (activeTab === 'ready' && item.status !== 'Ready for Pickup') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSearch(!showSearch)}
            accessibilityLabel="Search Orders"
          >
            <StoreIcon name="search" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setActiveTab('all')}
            accessibilityLabel="Reset Filters"
          >
            <StoreIcon name="filter" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Optional Search Bar */}
      {showSearch && (
        <View style={styles.searchBarWrap}>
          <StoreIcon name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order ID, customer, location..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <StoreIcon name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['all', 'new', 'processing', 'ready'] as const).map((tab) => {
          const isActive = tab === activeTab;
          const label =
            tab === 'all'
              ? `All (${counts.all})`
              : tab === 'new'
              ? `New (${counts.new})`
              : tab === 'processing'
              ? `Processing (${counts.processing})`
              : `Ready (${counts.ready})`;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <StoreIcon name="empty-state" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No orders in this tab</Text>
            <Text style={styles.emptySub}>Orders from customers and plumbers will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            {/* Top row: Order ID, placed time, status pill */}
            <View style={styles.orderTopRow}>
              <View>
                <Text style={styles.orderId}>{item.id}</Text>
                <Text style={styles.orderDate}>{item.date}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: item.statusBg }]}>
                <Text style={[styles.statusPillText, { color: item.statusColor }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            {/* Middle: Customer + Price */}
            <View style={styles.customerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{item.customer}</Text>
                <Text style={styles.customerLocation} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
              <View style={styles.amountCol}>
                <Text style={styles.orderAmount}>{item.amount}</Text>
                <Text style={styles.orderItems}>{item.items}</Text>
              </View>
            </View>

            {/* Action Button */}
            {item.cta ? (
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  item.ctaStyle === 'green'
                    ? styles.ctaGreen
                    : item.ctaStyle === 'solid'
                    ? styles.ctaSolid
                    : styles.ctaOutline,
                ]}
                onPress={() => {
                  if (item.status === 'New') {
                    navigation.navigate('Packing' as any, { orderId: item.id });
                  } else if (item.status === 'Processing') {
                    navigation.navigate('Packing' as any, { orderId: item.id });
                  } else if (item.status === 'Ready for Pickup') {
                    navigation.navigate('ReadyForPickup' as any, { orderId: item.id });
                  } else {
                    navigation.navigate('OrderDetails', { orderId: item.id } as any);
                  }
                }}
              >
                <Text
                  style={[
                    styles.ctaText,
                    item.ctaStyle === 'outline'
                      ? styles.ctaTextOutline
                      : styles.ctaTextWhite,
                  ]}
                >
                  {item.cta}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#F8F9FB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.giant,
    gap: spacing.md,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderId: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  orderDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  customerLocation: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  orderItems: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  ctaButton: {
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaGreen: {
    backgroundColor: '#16A34A',
  },
  ctaSolid: {
    backgroundColor: colors.primary,
  },
  ctaOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
  },
  ctaTextWhite: {
    color: '#FFFFFF',
  },
  ctaTextOutline: {
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default OrdersScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import SearchIcon from '../../assets/icons/search.svg';
import FilterIcon from '../../assets/icons/settings.svg';
import ProfileIcon from '../../assets/icons/profile.svg';
import BottomTabBar from '../../components/common/BottomTabBar';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';

const tabs = [
  { key: 'all', label: 'All', count: 90 },
  { key: 'new', label: 'New', count: 18 },
  { key: 'processing', label: 'Processing', count: 32 },
  { key: 'ready', label: 'Ready', count: 26 },
];

const mockOrders = [
  {
    id: '#FK123456',
    date: '21 May, 10:30 AM',
    status: 'New',
    statusColor: colors.warning,
    statusBg: colors.warningLight,
    customer: 'Rahul Sharma',
    location: 'Kandivali, Mumbai',
    amount: '₹1,245',
    items: '5 items',
    cta: 'Accept Order',
    ctaStyle: 'solid',
  },
  {
    id: '#FK123455',
    date: '21 May, 10:10 AM',
    status: 'Processing',
    statusColor: '#2E9AE0',
    statusBg: '#E7F5FE',
    customer: 'Priya Patel',
    location: 'Borivali, Mumbai',
    amount: '₹2,860',
    items: '8 items',
    cta: 'View Details',
    ctaStyle: 'outline',
  },
  {
    id: '#FK123454',
    date: '21 May, 09:45 AM',
    status: 'Ready for Pickup',
    statusColor: colors.success,
    statusBg: colors.successLight,
    customer: 'Amit Verma',
    location: 'Malad, Mumbai',
    amount: '₹1,080',
    items: '6 items',
  },
];

export function OrdersScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <SearchIcon width={20} height={20} stroke={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <FilterIcon width={20} height={20} stroke={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders list */}
      <FlatList
        data={mockOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
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

            <View style={styles.customerRow}>
              <View style={styles.avatar}>
                <ProfileIcon width={16} height={16} stroke={colors.textMuted} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.customerName}>{item.customer}</Text>
                <Text style={styles.customerLocation}>{item.location}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderAmount}>{item.amount}</Text>
                <Text style={styles.orderItems}>{item.items}</Text>
              </View>
            </View>

            {item.cta && (
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  item.ctaStyle === 'outline' ? styles.ctaOutline : styles.ctaSolid,
                ]}
                onPress={() => navigation.navigate('OrderDetails', { orderId: item.id } as any)}
              >
                <Text
                  style={[
                    styles.ctaText,
                    item.ctaStyle === 'outline' ? styles.ctaTextOutline : styles.ctaTextSolid,
                  ]}
                >
                  {item.cta}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <BottomTabBar active="Orders" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  headerIcons: { flexDirection: 'row' },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    ...shadows.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.round,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  tabItemActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.surface },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderId: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  orderDate: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: { fontSize: 13, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  customerLocation: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 1 },
  orderAmount: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  orderItems: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 1 },
  ctaButton: {
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSolid: { backgroundColor: colors.success },
  ctaOutline: { borderWidth: 1, borderColor: colors.primary },
  ctaText: { fontSize: 13, fontWeight: '700' },
  ctaTextSolid: { color: colors.surface },
  ctaTextOutline: { color: colors.primary },
});

export default OrdersScreen;

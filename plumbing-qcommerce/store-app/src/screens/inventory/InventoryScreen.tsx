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
import PlusIcon from '../../assets/icons/plus.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import BottomTabBar from '../../components/common/BottomTabBar';
import { colors, borderRadius, spacing, typography } from '../../theme';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'inStock', label: 'In Stock' },
  { key: 'lowStock', label: 'Low Stock (7)' },
  { key: 'outOfStock', label: 'Out of Stock' },
];

const mockProducts = [
  {
    id: '1',
    name: 'PVC Elbow 1/2 inch',
    category: 'Plumbing · 1/2 inch',
    qty: 'Qty: 3',
    status: 'Low Stock',
  },
  {
    id: '2',
    name: 'Brass Angle Valve 1/2 inch',
    category: 'Plumbing · 1/2 inch',
    qty: 'Qty: 4',
    status: 'Low Stock',
  },
  {
    id: '3',
    name: 'CPVC Pipe 1/2 inch (3m)',
    category: 'Plumbing · 1/2 inch',
    qty: 'Qty: 6',
    status: 'Low Stock',
  },
  {
    id: '4',
    name: 'PTFE Thread Tape (10m)',
    category: 'Plumbing · Tape',
    qty: 'Qty: 5',
    status: 'Low Stock',
  },
];

export function InventoryScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState('lowStock');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
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
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Product list */}
      <FlatList
        data={mockProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`store-product-card-${item.id}`}
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id } as any)}
          >
            <View style={styles.productImage}>
              <WarehouseIcon width={26} height={26} stroke={colors.textMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <Text style={styles.productQty}>{item.qty}</Text>
            </View>
            <View style={styles.lowStockPill}>
              <Text style={styles.lowStockPillText}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.reorderButton}>
            <Text style={styles.reorderButtonText}>Reorder Selected</Text>
          </TouchableOpacity>
        }
      />

      <TouchableOpacity
        testID="store-add-product-fab"
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <PlusIcon width={24} height={24} stroke={colors.surface} />
      </TouchableOpacity>

      <BottomTabBar active="Inventory" navigation={navigation} />
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
    backgroundColor: colors.surface,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tabItem: { marginRight: 20, paddingBottom: 10 },
  tabLabel: { fontSize: typography.fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: colors.primary },
  tabIndicator: {
    height: 2,
    backgroundColor: colors.primary,
    marginTop: 8,
    borderRadius: 2,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: 13.5, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  productCategory: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  productQty: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  lowStockPill: {
    backgroundColor: colors.accentRedLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  lowStockPillText: { color: colors.accentRed, fontSize: 10.5, fontWeight: '700' },
  reorderButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  reorderButtonText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 84,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});

export default InventoryScreen;

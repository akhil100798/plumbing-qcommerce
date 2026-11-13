import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { StoreIcon } from '../../components/common/StoreIcon';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface LowStockItem {
  id: string;
  name: string;
  stockLeft: number;
  reorderLevel: number;
  icon: 'pvc-elbow' | 'brass-valve' | 'cpvc-pipe' | 'thread-tape';
  supplier: string;
}

const initialLowStockItems: LowStockItem[] = [
  {
    id: '1',
    name: 'PVC Elbow 1/2 Inch',
    stockLeft: 4,
    reorderLevel: 10,
    icon: 'pvc-elbow',
    supplier: 'Astral Pipes Ltd.',
  },
  {
    id: '2',
    name: 'Brass Angle Valve 1/2 Inch',
    stockLeft: 3,
    reorderLevel: 10,
    icon: 'brass-valve',
    supplier: 'Supreme Hardware',
  },
  {
    id: '3',
    name: 'CPVC Pipe 1/2 Inch (3m)',
    stockLeft: 5,
    reorderLevel: 15,
    icon: 'cpvc-pipe',
    supplier: 'Ashirvad Pipes',
  },
  {
    id: '4',
    name: 'PTFE Thread Tape (10m)',
    stockLeft: 8,
    reorderLevel: 20,
    icon: 'thread-tape',
    supplier: 'FixKart Direct',
  },
];

export function LowStockAlertScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [items, setItems] = useState<LowStockItem[]>(initialLowStockItems);
  const [reorderedIds, setReorderedIds] = useState<Record<string, boolean>>({});

  const handleReorder = (item: LowStockItem) => {
    Alert.alert(
      'Create Purchase Order',
      `Generate procurement request to supplier ${item.supplier} for 50 units of ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm PO',
          onPress: () => {
            setReorderedIds((prev) => ({ ...prev, [item.id]: true }));
            Alert.alert('PO Created', `Purchase order sent to ${item.supplier}. Expected delivery in 24 hours.`);
          },
        },
      ]
    );
  };

  const handleReorderAll = () => {
    Alert.alert(
      'Bulk Reorder',
      `Generate purchase orders for all ${items.length} critical items from registered suppliers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Order All',
          onPress: () => {
            const allReordered: Record<string, boolean> = {};
            items.forEach((it) => (allReordered[it.id] = true));
            setReorderedIds(allReordered);
            Alert.alert('Bulk Orders Placed', 'All replenishment orders submitted successfully.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'InventoryTab' });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Low Stock Alert</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Shortage Count Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIconContainer}>
          <StoreIcon name="warning" size={20} color={colors.error} />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>
            {items.length} items below minimum threshold
          </Text>
          <Text style={styles.bannerSubtitle}>
            Restock now to prevent counter shortages during plumber pickups.
          </Text>
        </View>
        <TouchableOpacity style={styles.bulkButton} onPress={handleReorderAll}>
          <Text style={styles.bulkButtonText}>Order All</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isOrdered = reorderedIds[item.id];
          return (
            <View style={styles.itemCard}>
              <View style={styles.itemThumb}>
                <StoreIcon name={item.icon} size={28} color={colors.error} />
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.stockLeftText}>Stock Left: {item.stockLeft}</Text>
                <Text style={styles.reorderLevelText}>
                  Reorder Level: {item.reorderLevel} · {item.supplier}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.reorderButton, isOrdered && styles.reorderButtonCompleted]}
                onPress={() => handleReorder(item)}
                disabled={isOrdered}
                activeOpacity={0.7}
              >
                {isOrdered ? (
                  <View style={styles.orderedRow}>
                    <StoreIcon name="success" size={12} color="#059669" />
                    <Text style={styles.orderedText}>Ordered</Text>
                  </View>
                ) : (
                  <Text style={styles.reorderButtonText}>Reorder</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Main', { screen: 'InventoryTab' })}
          >
            <StoreIcon name="inventory" size={16} color={colors.primary} />
            <Text style={styles.viewAllText}>View All Inventory</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: 12,
  },
  bannerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bulkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
  },
  bulkButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  stockLeftText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
    marginTop: 2,
  },
  reorderLevelText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  reorderButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.surface,
  },
  reorderButtonCompleted: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  reorderButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
  orderedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default LowStockAlertScreen;

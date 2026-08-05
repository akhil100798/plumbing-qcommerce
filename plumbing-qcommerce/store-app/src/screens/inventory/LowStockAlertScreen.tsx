import React from 'react';
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
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { colors, borderRadius, spacing, typography } from '../../theme';

const lowStockItems = [
  {
    id: '1',
    name: 'PVC Elbow 1/2 inch',
    left: 'Only 2 left',
    reorderLevel: 'Reorder Level: 10',
  },
  {
    id: '2',
    name: 'Brass Angle Valve 1/2 inch',
    left: 'Only 4 left',
    reorderLevel: 'Reorder Level: 10',
  },
  {
    id: '3',
    name: 'CPVC Pipe 1/2 inch (3m)',
    left: 'Only 6 left',
    reorderLevel: 'Reorder Level: 15',
  },
  {
    id: '4',
    name: 'PTFE Thread Tape (10m)',
    left: 'Only 5 left',
    reorderLevel: 'Reorder Level: 10',
  },
];

export function LowStockAlertScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const handleReorder = (itemName: string) => {
    Alert.alert('Reorder Submitted', `Purchase request generated for ${itemName}.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Low Stock Alert</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={lowStockItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemImage}>
              <WarehouseIcon width={24} height={24} stroke={colors.textMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemLeft}>{item.left}</Text>
              <Text style={styles.itemReorder}>{item.reorderLevel}</Text>
            </View>
            <TouchableOpacity style={styles.reorderButton} onPress={() => handleReorder(item.name)}>
              <Text style={styles.reorderButtonText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Main', { screen: 'InventoryTab' })}
          >
            <Text style={styles.viewAllText}>View All Inventory</Text>
          </TouchableOpacity>
        }
      />
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
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 13.5, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  itemLeft: { fontSize: typography.fontSize.xs, color: colors.accentRed, marginTop: 3, fontWeight: '600' },
  itemReorder: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  reorderButton: {
    borderWidth: 1,
    borderColor: colors.accentRed,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  reorderButtonText: { color: colors.accentRed, fontSize: 12, fontWeight: '700' },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  viewAllText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
});

export default LowStockAlertScreen;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import FilterIcon from '../../assets/icons/settings.svg';
import { colors, borderRadius, spacing, typography } from '../../theme';

const specs = [
  { label: 'SKU', value: 'PVE-EL-12' },
  { label: 'Category', value: 'Plumbing Fittings' },
  { label: 'Brand', value: 'FixKart' },
  { label: 'Stock', value: '3 Units (Low Stock)', valueColor: colors.accentRed },
  { label: 'Reorder Level', value: '10 Units' },
  { label: 'Sold (30 Days)', value: '124 Units' },
];

export function ProductDetailsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('Main', { screen: 'InventoryTab' }); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity onPress={() => Alert.alert('Edit Product', 'Navigating to product edit form.')}>
          <FilterIcon width={19} height={19} stroke={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Product summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.productImage}>
              <WarehouseIcon width={40} height={40} stroke={colors.textMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <Text style={styles.productName}>PVC Elbow 1/2 inch</Text>
              <Text style={styles.productCategory}>Plumbing fitting</Text>
              <View style={styles.inStockPill}>
                <Text style={styles.inStockPillText}>In Stock</Text>
              </View>
              <Text style={styles.price}>₹12.00</Text>
              <Text style={styles.priceNote}>MRP (Incl. Tax)</Text>
            </View>
          </View>

          {/* Specs card */}
          <View style={styles.specsCard}>
            {specs.map((spec, idx) => (
              <View
                key={spec.label}
                style={[styles.specRow, idx !== specs.length - 1 && styles.specRowBorder]}
              >
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text style={[styles.specValue, spec.valueColor ? { color: spec.valueColor } : null]}>
                  {spec.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate('SalesAnalytics')}>
          <Text style={styles.outlineButtonText}>View Sales</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.solidButton} onPress={() => Alert.alert('Add Stock', 'Stock inventory modal opened.')}>
          <Text style={styles.solidButtonText}>Add Stock</Text>
        </TouchableOpacity>
      </View>
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
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  productCategory: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2, marginBottom: 8 },
  inStockPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
    marginBottom: 10,
  },
  inStockPillText: { color: colors.accentGreen, fontSize: 10.5, fontWeight: '700' },
  price: { fontSize: 20, fontWeight: typography.fontWeight.black, color: colors.textPrimary },
  priceNote: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 1 },
  specsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  specRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  specLabel: { fontSize: 13, color: colors.textSecondary },
  specValue: { fontSize: 13, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  outlineButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  outlineButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
  solidButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.surface },
});

export default ProductDetailsScreen;

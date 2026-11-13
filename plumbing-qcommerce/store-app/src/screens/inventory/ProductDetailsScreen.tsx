import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { StoreIcon } from '../../components/common/StoreIcon';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface SpecRow {
  label: string;
  value: string;
  badge?: {
    text: string;
    type: 'success' | 'warning' | 'error';
  };
}

export function ProductDetailsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockToAdd, setStockToAdd] = useState('25');
  const [currentStock, setCurrentStock] = useState(248);

  const specs: SpecRow[] = [
    { label: 'SKU', value: 'PVC-EL-12' },
    { label: 'Category', value: 'Plumbing Fittings' },
    { label: 'Brand', value: 'FixKart Pro / T-Brand' },
    {
      label: 'Stock Available',
      value: `${currentStock} units`,
      badge: { text: currentStock > 50 ? 'In Stock' : 'Low Stock', type: currentStock > 50 ? 'success' : 'error' },
    },
    { label: 'Reorder Level', value: '50 units' },
    { label: 'Sold (Last 30 Days)', value: '124 units' },
    { label: 'Store Shelf Location', value: 'Aisle B · Bin 04' },
    { label: 'Counter Self-Pickup', value: 'Ready in 5 mins' },
  ];

  const handleAddStockConfirm = () => {
    const qty = parseInt(stockToAdd, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number.');
      return;
    }
    setCurrentStock((prev) => prev + qty);
    setStockModalVisible(false);
    Alert.alert('Stock Updated', `Successfully added ${qty} units. New balance: ${currentStock + qty} units.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top App Bar */}
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
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Edit Product', 'Product modification requires store manager permission.')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="edit" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.imageCard}>
            <StoreIcon name="pvc-elbow" size={56} color={colors.primary} />
          </View>
          <View style={styles.heroDetails}>
            <Text style={styles.productName}>PVC Elbow 1/2 Inch</Text>
            <Text style={styles.brandSubtitle}>Plumbing Fittings · FixKart Genuine</Text>

            <View style={styles.inStockBadge}>
              <StoreIcon name="success" size={12} color="#059669" />
              <Text style={styles.inStockText}>In Stock</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₹12.00</Text>
              <Text style={styles.mrpPrice}>MRP ₹14.00</Text>
              <Text style={styles.taxLabel}>(Incl. GST)</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Product Specifications Section */}
        <View style={styles.specsSection}>
          <Text style={styles.specsHeader}>Product Specifications</Text>
          <View style={styles.specsCard}>
            {specs.map((item, index) => (
              <View
                key={item.label}
                style={[styles.specRow, index !== specs.length - 1 && styles.specRowBorder]}
              >
                <Text style={styles.specLabel}>{item.label}</Text>
                <View style={styles.specValueContainer}>
                  <Text style={styles.specValue}>{item.value}</Text>
                  {item.badge && (
                    <View
                      style={[
                        styles.specBadge,
                        item.badge.type === 'success'
                          ? styles.specBadgeSuccess
                          : styles.specBadgeError,
                      ]}
                    >
                      <Text
                        style={[
                          styles.specBadgeText,
                          item.badge.type === 'success'
                            ? styles.specBadgeTextSuccess
                            : styles.specBadgeTextError,
                        ]}
                      >
                        {item.badge.text}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Counter Self-Pickup Operational Notice */}
        <View style={styles.noticeCard}>
          <StoreIcon name="store" size={20} color={colors.primary} />
          <View style={styles.noticeTextContainer}>
            <Text style={styles.noticeTitle}>Store Counter Fulfillment</Text>
            <Text style={styles.noticeSubtitle}>
              Ensure items are organized on shelf Aisle B · Bin 04 for immediate counter pickup when plumbers arrive.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SalesAnalytics')}
          activeOpacity={0.8}
        >
          <StoreIcon name="chart" size={18} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>View Sales</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStockModalVisible(true)}
          activeOpacity={0.85}
        >
          <StoreIcon name="plus" size={18} color={colors.surface} />
          <Text style={styles.primaryButtonText}>Add Stock</Text>
        </TouchableOpacity>
      </View>

      {/* Stock Adjustment Modal */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Inventory Stock</Text>
              <TouchableOpacity onPress={() => setStockModalVisible(false)}>
                <StoreIcon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the number of units received from supplier to increase counter stock for PVC Elbow 1/2 Inch.
            </Text>

            <Text style={styles.inputLabel}>Units Received</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={stockToAdd}
              onChangeText={setStockToAdd}
              placeholder="e.g. 25"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setStockModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddStockConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  imageCard: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDetails: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  productName: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: borderRadius.round,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    gap: 4,
  },
  inStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    gap: 6,
  },
  currentPrice: {
    fontSize: 19,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  mrpPrice: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  taxLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xl,
  },
  specsSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  specsHeader: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  specsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  specRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  specValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  specBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  specBadgeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  specBadgeError: {
    backgroundColor: '#FEF2F2',
  },
  specBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  specBadgeTextSuccess: {
    color: '#059669',
  },
  specBadgeTextError: {
    color: colors.error,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: spacing.md,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  noticeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: 6,
  },
  modalInput: {
    height: 46,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
});

export default ProductDetailsScreen;

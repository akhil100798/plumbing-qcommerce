import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import PlusIcon from '../../assets/icons/plus.svg';
import { colors, borderRadius, spacing, typography } from '../../theme';

export function AddProductScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [productName, setProductName] = useState('Brass Ball Valve 1/2 inch');
  const [sellingPrice, setSellingPrice] = useState('245');
  const [mrp, setMrp] = useState('290');
  const [stockQty, setStockQty] = useState('25');
  const [reorderLevel, setReorderLevel] = useState('10');

  const handleSave = () => {
    Alert.alert('Product Saved', 'Product has been saved successfully to store inventory.', [
      { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'InventoryTab' }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('Main', { screen: 'InventoryTab' }); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Product</Text>
          <TouchableOpacity onPress={handleSave}>
            <SuccessCheckIcon width={22} height={22} stroke={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Image picker */}
            <Text style={styles.sectionLabel}>Add Product Images</Text>
            <View style={styles.imageRow}>
              <TouchableOpacity style={[styles.imageSlot, styles.imageSlotActive]} onPress={() => Alert.alert('Add Photo', 'Camera or Gallery picker opened.')}>
                <PlusIcon width={20} height={20} stroke={colors.primary} />
              </TouchableOpacity>
              <View style={styles.imageSlot}>
                <WarehouseIcon width={22} height={22} stroke={colors.textMuted} />
              </View>
              <View style={styles.imageSlot}>
                <WarehouseIcon width={22} height={22} stroke={colors.textMuted} />
              </View>
              <View style={styles.imageSlot}>
                <WarehouseIcon width={22} height={22} stroke={colors.textMuted} />
              </View>
            </View>

            {/* Product Name */}
            <Text style={styles.fieldLabel}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
              placeholderTextColor={colors.textMuted}
            />

            {/* Category / Brand */}
            <View style={styles.rowTwo}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => Alert.alert('Select Category', 'Plumbing Fittings selected.')}>
                  <Text style={styles.dropdownText}>Plumbing Fittings</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>▼</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Brand</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => Alert.alert('Select Brand', 'FixKart selected.')}>
                  <Text style={styles.dropdownText}>FixKart</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Selling Price / MRP */}
            <View style={styles.rowTwo}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Selling Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>MRP (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={mrp}
                  onChangeText={setMrp}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Stock Qty / Reorder Level */}
            <View style={styles.rowTwo}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={stockQty}
                  onChangeText={setStockQty}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Reorder Level *</Text>
                <TextInput
                  style={styles.input}
                  value={reorderLevel}
                  onChangeText={setReorderLevel}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Product</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  sectionLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  imageRow: { flexDirection: 'row', marginBottom: spacing.xl },
  imageSlot: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  imageSlotActive: {
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primaryLight,
  },
  fieldLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  rowTwo: { flexDirection: 'row', justifyContent: 'space-between' },
  halfField: { width: '48%' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  dropdownText: { fontSize: typography.fontSize.sm, color: colors.textPrimary },
  saveButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
});

export default AddProductScreen;

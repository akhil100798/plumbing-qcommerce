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
import { StoreIcon } from '../../components/common/StoreIcon';
import { colors, borderRadius, spacing, typography } from '../../theme';

const categories = [
  'Plumbing Fittings',
  'Pipes & Tubes',
  'Valves & Controls',
  'Tapes & Sealants',
  'Sanitary Ware',
];

const brands = ['FixKart Pro', 'Astral', 'Supreme', 'Ashirvad', 'Finolex'];

export function AddProductScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [productName, setProductName] = useState('PVC Elbow 1/2 Inch');
  const [selectedCategory, setSelectedCategory] = useState('Plumbing Fittings');
  const [selectedBrand, setSelectedBrand] = useState('FixKart Pro');
  const [sellingPrice, setSellingPrice] = useState('12.00');
  const [mrp, setMrp] = useState('14.00');
  const [stockQty, setStockQty] = useState('100');
  const [reorderLevel, setReorderLevel] = useState('25');
  const [description, setDescription] = useState('Heavy duty 90 degree PVC elbow fitting for residential cold water plumbing line.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = () => {
    if (!productName.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name.');
      return;
    }
    if (!sellingPrice.trim() || isNaN(Number(sellingPrice))) {
      Alert.alert('Validation Error', 'Please enter a valid selling price.');
      return;
    }
    if (!stockQty.trim() || isNaN(Number(stockQty))) {
      Alert.alert('Validation Error', 'Please enter a valid initial stock quantity.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Product Added',
        `"${productName}" has been successfully added to your store inventory for counter pickup.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Main', { screen: 'InventoryTab' });
            },
          },
        ]
      );
    }, 600);
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
          <Text style={styles.headerTitle}>Add Product</Text>
          <TouchableOpacity
            onPress={handleSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.headerButton}
            disabled={isSubmitting}
          >
            <StoreIcon name="save" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Product Images</Text>
            <Text style={styles.sectionSubtitle}>
              Upload up to 4 photos of the item packaging and dimensions
            </Text>
            <View style={styles.imageRow}>
              <TouchableOpacity
                style={styles.addImageSlot}
                onPress={() => Alert.alert('Add Photo', 'Camera or photo gallery selector opened.')}
                activeOpacity={0.8}
              >
                <StoreIcon name="camera" size={22} color={colors.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>

              <View style={styles.previewSlot}>
                <StoreIcon name="pvc-elbow" size={28} color={colors.primary} />
              </View>
              <View style={styles.previewSlot}>
                <StoreIcon name="brass-valve" size={28} color={colors.warning} />
              </View>
              <View style={styles.previewSlot}>
                <StoreIcon name="thread-tape" size={28} color={colors.textMuted} />
              </View>
            </View>
          </View>

          {/* Product Details Form */}
          <View style={styles.formCard}>
            {/* Product Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Product Name <Text style={styles.asterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g. PVC Elbow 1/2 Inch"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Category & Brand (2-Column) */}
            <View style={styles.rowTwo}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  Category <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => {
                    const next = (categories.indexOf(selectedCategory) + 1) % categories.length;
                    setSelectedCategory(categories[next]);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectText} numberOfLines={1}>
                    {selectedCategory}
                  </Text>
                  <StoreIcon name="chevron-down" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  Brand <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => {
                    const next = (brands.indexOf(selectedBrand) + 1) % brands.length;
                    setSelectedBrand(brands[next]);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectText} numberOfLines={1}>
                    {selectedBrand}
                  </Text>
                  <StoreIcon name="chevron-down" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pricing (2-Column) */}
            <View style={styles.rowTwo}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  Selling Price (₹) <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="decimal-pad"
                  placeholder="12.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>MRP (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={mrp}
                  onChangeText={setMrp}
                  keyboardType="decimal-pad"
                  placeholder="14.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Stock & Reorder Level (2-Column) */}
            <View style={styles.rowTwo}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  Stock Quantity <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={stockQty}
                  onChangeText={setStockQty}
                  keyboardType="number-pad"
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Reorder Alert Level</Text>
                <TextInput
                  style={styles.input}
                  value={reorderLevel}
                  onChangeText={setReorderLevel}
                  keyboardType="number-pad"
                  placeholder="25"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Product Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Specifications, size, thread standards..."
                placeholderTextColor={colors.textMuted}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Staging Catalog Notice */}
          <View style={styles.stagingNotice}>
            <StoreIcon name="store" size={18} color={colors.primary} />
            <Text style={styles.stagingNoticeText}>
              Newly added products become available immediately in your store's counter catalog for plumber materials requests.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky Bottom Save Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <StoreIcon name="save" size={18} color={colors.surface} />
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Saving to Catalog...' : 'Save Product to Inventory'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 24,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addImageSlot: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 3,
  },
  previewSlot: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  asterisk: {
    color: colors.error,
  },
  input: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 72,
    paddingTop: 10,
    paddingBottom: 10,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  selectInput: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  selectText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 4,
  },
  stagingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  stagingNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
});

export default AddProductScreen;

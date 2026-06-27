import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { PrimaryButton } from '../common/PrimaryButton';
import { Product, Offer } from '../../types';

// ==========================================
// PRODUCT FORM (ADD/EDIT PRODUCT)
// ==========================================
interface ProductFormProps {
  initialValues?: Partial<Product>;
  onSubmit: (values: Partial<Product>) => void;
  submitTitle?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialValues = {},
  onSubmit,
  submitTitle = 'Save Product',
}) => {
  const [name, setName] = useState(initialValues.name || '');
  const [sku, setSku] = useState(initialValues.sku || '');
  const [price, setPrice] = useState(initialValues.price ? String(initialValues.price) : '');
  const [mrp, setMrp] = useState(initialValues.mrp ? String(initialValues.mrp) : '');
  const [stock, setStock] = useState(initialValues.stock ? String(initialValues.stock) : '');
  const [brand, setBrand] = useState(initialValues.brand || '');
  const [gst, setGst] = useState(initialValues.gst ? String(initialValues.gst) : '18');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) return setError('Product name is required');
    if (!price.trim() || isNaN(Number(price))) return setError('Valid price is required');
    if (!mrp.trim() || isNaN(Number(mrp))) return setError('Valid MRP is required');
    if (!stock.trim() || isNaN(Number(stock))) return setError('Valid stock is required');
    
    setError(null);
    onSubmit({
      name,
      sku: sku.trim() || undefined,
      price: Number(price),
      mrp: Number(mrp),
      stock: Number(stock),
      brand: brand.trim() || undefined,
      gst: Number(gst),
      categoryId: 1, // default Category (PVC Pipes)
      categoryName: 'PVC Pipes',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.formScroll}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ashirvad PVC Pipe"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>SKU Code</Text>
        <TextInput
          style={styles.textInput}
          value={sku}
          onChangeText={setSku}
          placeholder="e.g. PVC-20MM-002"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.textInput}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="220"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.label}>MRP (₹) *</Text>
          <TextInput
            style={styles.textInput}
            value={mrp}
            onChangeText={setMrp}
            keyboardType="numeric"
            placeholder="250"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Stock *</Text>
          <TextInput
            style={styles.textInput}
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            placeholder="45"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.label}>GST (%)</Text>
          <TextInput
            style={styles.textInput}
            value={gst}
            onChangeText={setGst}
            keyboardType="numeric"
            placeholder="18"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Brand</Text>
        <TextInput
          style={styles.textInput}
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g. Ashirvad"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <PrimaryButton
        title={submitTitle}
        onPress={handleSave}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
};

// ==========================================
// OFFER FORM (CREATE NEW PROMO)
// ==========================================
interface OfferFormProps {
  onSubmit: (values: Partial<Offer>) => void;
}

export const OfferForm: React.FC<OfferFormProps> = ({ onSubmit }) => {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!code.trim()) return setError('Promo code is required');
    if (!description.trim()) return setError('Description is required');
    if (!value.trim() || isNaN(Number(value))) return setError('Valid discount value is required');
    
    setError(null);
    onSubmit({
      code: code.toUpperCase().trim(),
      description,
      value: Number(value),
      minOrderAmount: Number(minOrder) || 0,
      active: true,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days default
    });
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Promo Code *</Text>
        <TextInput
          style={styles.textInput}
          value={code}
          onChangeText={setCode}
          placeholder="e.g. FLAT100"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Flat ₹100 OFF on orders above ₹500"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Value (₹ / %) *</Text>
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.label}>Min Order Amount (₹)</Text>
          <TextInput
            style={styles.textInput}
            value={minOrder}
            onChangeText={setMinOrder}
            keyboardType="numeric"
            placeholder="500"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <PrimaryButton
        title="Create Offer"
        onPress={handleSubmit}
        style={styles.submitBtn}
      />
    </View>
  );
};

// ==========================================
// STOCK UPDATE FORM (OVERLAY FORM)
// ==========================================
interface StockUpdateFormProps {
  currentStock: number;
  onSave: (newStock: number) => void;
  onCancel: () => void;
}

export const StockUpdateForm: React.FC<StockUpdateFormProps> = ({
  currentStock,
  onSave,
  onCancel,
}) => {
  const [stockInput, setStockInput] = useState(String(currentStock));

  const handleIncrement = () => {
    setStockInput(prev => String(Number(prev || 0) + 1));
  };

  const handleDecrement = () => {
    setStockInput(prev => String(Math.max(0, Number(prev || 0) - 1)));
  };

  const handleSave = () => {
    const value = Number(stockInput);
    if (!isNaN(value) && value >= 0) {
      onSave(value);
    }
  };

  return (
    <View style={styles.stockCard}>
      <Text style={styles.stockTitle}>Update Stock Count</Text>
      
      <View style={styles.stepperContainer}>
        <TouchableOpacity style={styles.stepBtn} onPress={handleDecrement}>
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.stockInput}
          value={stockInput}
          onChangeText={setStockInput}
          keyboardType="numeric"
          textAlign="center"
        />
        <TouchableOpacity style={styles.stepBtn} onPress={handleIncrement}>
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  formScroll: {
    padding: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  submitBtn: {
    marginTop: spacing.md,
  },

  // StockUpdateForm
  stockCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  stockTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  stockInput: {
    width: 80,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  cancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    color: colors.card,
    fontWeight: typography.fontWeight.bold,
  },
});

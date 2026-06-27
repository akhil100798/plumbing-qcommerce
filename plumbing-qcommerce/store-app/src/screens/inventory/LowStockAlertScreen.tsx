import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Alert } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { ProductCard } from '../../components/cards/InventoryCards';
import { inventoryService } from '../../services/inventory/inventoryService';
import { useAppDispatch } from '../../redux/store';
import { updateProductInSlice } from '../../redux/slices/inventorySlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Product } from '../../types';

export const LowStockAlertScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();

  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLowStock = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getLowStock();
      setLowStockItems(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve low stock catalog list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLowStock();
  }, []);

  const handleRestock = (product: Product) => {
    Alert.prompt(
      'Restock Item',
      `Enter restock quantity for ${product.name} (Current: ${product.stock}):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restock',
          onPress: async (val) => {
            const addQty = Number(val);
            if (isNaN(addQty) || addQty <= 0) {
              return Alert.alert('Invalid Input', 'Please enter a valid count');
            }
            
            setLoading(true);
            try {
              const newTotal = product.stock + addQty;
              const updated = await inventoryService.updateStock(product.id, newTotal);
              dispatch(updateProductInSlice(updated));
              // Update local state list
              setLowStockItems(prev => prev.filter(p => p.id !== product.id));
              Alert.alert('Restock Successful', `${product.name} restocked to ${newTotal} units.`);
            } catch (e: any) {
              Alert.alert('Restock Failed', e.message || 'Operation failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'plain-text',
      '50'
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Low Stock Alerts" onBack={() => navigation.goBack()} />

      <View style={styles.alertHeader}>
        <View style={styles.alertIconBox}>
          <Text style={styles.alertEmoji}>⚠️</Text>
        </View>
        <View style={styles.alertTextWrapper}>
          <Text style={styles.alertTitle}>{lowStockItems.length} Products are low in stock</Text>
          <Text style={styles.alertSub}>Immediate restock required to prevent purchase cancellations.</Text>
        </View>
      </View>

      <FlatList
        data={lowStockItems}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadLowStock}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
            onEditPress={() => handleRestock(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>All products are sufficiently stocked!</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  alertHeader: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.layout,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  alertEmoji: {
    fontSize: 16,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.danger,
  },
  alertSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  list: {
    paddingHorizontal: spacing.layout,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
});
export default LowStockAlertScreen;

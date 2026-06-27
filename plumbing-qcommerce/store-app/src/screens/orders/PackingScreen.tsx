import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Alert } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { PackingItemCard } from '../../components/cards/OrderCards';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ordersService } from '../../services/orders/ordersService';
import { useAppDispatch } from '../../redux/store';
import { updateOrderInSlice } from '../../redux/slices/ordersSlice';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Order } from '../../types';

export const PackingScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'Packing'>>();
  const dispatch = useAppDispatch();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [packedItems, setPackedItems] = useState<Record<number, boolean>>({});
  const [packingNote, setPackingNote] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDetails = async () => {
    try {
      const data = await ordersService.getOrderDetails(orderId);
      setOrder(data);
      // Initialize check state
      const initialMap: Record<number, boolean> = {};
      data.items.forEach(item => {
        initialMap[item.productId] = false;
      });
      setPackedItems(initialMap);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to retrieve order items');
    }
  };

  useEffect(() => {
    loadDetails();
  }, [orderId]);

  const togglePacked = (productId: number) => {
    setPackedItems(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const getPackedCount = () => {
    return Object.values(packedItems).filter(v => v).length;
  };

  const handleMarkAsPacked = async () => {
    if (!order) return;
    
    const allPacked = order.items.every(item => packedItems[item.productId]);
    if (!allPacked) {
      return Alert.alert(
        'Incomplete Packing',
        'Please verify and pack all order items before marking complete.'
      );
    }

    setLoading(true);
    try {
      const updated = await ordersService.markPacked(order.id, packingNote);
      dispatch(updateOrderInSlice(updated));
      Alert.alert('Order Packed!', 'Rider notified and waiting for pickup.', [
        { text: 'View Rider Status', onPress: () => navigation.navigate('ReadyForPickup', { orderId: order.id }) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading details...</Text>
      </ScreenWrapper>
    );
  }

  const packedCount = getPackedCount();
  const totalCount = order.items.length;

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Packing Order" subtitle={`#ORD-${order.id}`} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.checklistHeader}>
          <Text style={styles.title}>Item Checklist</Text>
          <Text style={styles.countText}>{packedCount} / {totalCount} Packed</Text>
        </View>

        <View style={styles.listContainer}>
          {order.items.map((item, idx) => (
            <PackingItemCard
              key={idx}
              item={item}
              isPacked={!!packedItems[item.productId]}
              onTogglePack={() => togglePacked(item.productId)}
            />
          ))}
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>Add Packing Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={packingNote}
            onChangeText={setPackingNote}
            placeholder="Write details e.g., Box 2 contains small parts..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Mark as Packed"
          onPress={handleMarkAsPacked}
          loading={loading}
          disabled={packedCount !== totalCount}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  scroll: {
    padding: spacing.layout,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  countText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  listContainer: {
    marginBottom: spacing.lg,
  },
  noteSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.giant,
  },
  noteLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    height: 80,
  },
  footer: {
    padding: spacing.layout,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
export default PackingScreen;

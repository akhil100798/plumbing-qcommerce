import React, { useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { materialService } from '../../services/materials/materialService';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { Store } from '../../types';

type Props = StackScreenProps<AppStackParamList, 'StoreSelection'>;

export function StoreSelectionScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await materialService.getAvailableStores();
        if (data.length === 0) {
          Alert.alert('No stores found', 'No active stores are available. Contact support.', [
            { text: 'Go Back', onPress: () => navigation.goBack() },
          ]);
        }
        setStores(data);
      } catch (err: any) {
        Alert.alert('Error', 'Failed to load stores. Please check your connection.', [
          { text: 'Retry', onPress: () => setLoading(true) },
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConfirm = () => {
    if (selected === null) {
      Alert.alert('Select a store', 'Please select a store to continue.');
      return;
    }
    const store = stores.find(s => s.id === selected)!;
    navigation.navigate('MaterialRequest', {
      jobId,
      storeId: store.id,
      storeName: store.name,
    });
  };

  const renderItem = ({ item }: { item: Store }) => {
    const isSelected = selected === item.id;
    return (
      <TouchableOpacity
        style={[styles.storeCard, isSelected && styles.storeCardSelected]}
        onPress={() => setSelected(item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.storeRow}>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
          <View style={styles.storeInfo}>
            <Text style={[styles.storeName, isSelected && styles.storeNameSelected]}>
              {item.name}
            </Text>
            <Text style={styles.storeAddress} numberOfLines={2}>
              {item.address}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Select Store" onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading stores…</Text>
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Choose which store will supply the materials for this job.
          </Text>
          <FlatList
            data={stores}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, selected === null && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={selected === null}
            >
              <Text style={styles.confirmBtnText}>
                {selected !== null
                  ? `Continue with ${stores.find(s => s.id === selected)?.name}`
                  : 'Select a store to continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginHorizontal: spacing.layout,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  list: { paddingHorizontal: spacing.layout, paddingBottom: 120 },
  storeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  storeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  storeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  storeInfo: { flex: 1 },
  storeName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  storeNameSelected: { color: colors.primary },
  storeAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.layout,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: colors.borderDark },
  confirmBtnText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});

export default StoreSelectionScreen;

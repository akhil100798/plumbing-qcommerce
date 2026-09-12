import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
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
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await materialService.getAvailableStores();
      // No mock fallback — show real data only
      setStores(data || []);
    } catch (err: any) {
      // No mock fallback — surface real error so user can retry
      setError(err.message || 'Unable to load stores. Please check your connection and try again.');
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

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
        testID={`plumber-store-card-${item.id}`}
        accessibilityRole="radio"
        accessibilityLabel={`${item.name}, ${item.address}`}
        accessibilityState={{ selected: isSelected }}
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
    <ScreenWrapper safeAreaStyle={styles.safeArea}>
      <AppHeader
        title="Select Hardware Store"
        subtitle="Choose a store for job materials"
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading stores…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could Not Load Stores</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadStores} accessibilityRole="button" accessibilityLabel="Retry loading stores">
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : stores.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>🏪</Text>
          <Text style={styles.errorTitle}>No Stores Available</Text>
          <Text style={styles.errorMessage}>
            No stores are currently available for this job. Please try again later.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadStores} accessibilityRole="button" accessibilityLabel="Retry loading stores">
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
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
            style={{ flex: 1 }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={true}
          />
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, selected === null && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={selected === null}
              accessibilityRole="button"
              accessibilityLabel={selected !== null ? 'Continue with selected store' : 'Select a store to continue'}
              accessibilityState={{ disabled: selected === null }}
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
  safeArea: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    maxHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
  },
  container: { backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.layout,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorIcon: { fontSize: 40, marginBottom: spacing.sm },
  errorTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryBtnText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
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
    padding: spacing.layout,
    backgroundColor: colors.surface,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    elevation: 8,
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

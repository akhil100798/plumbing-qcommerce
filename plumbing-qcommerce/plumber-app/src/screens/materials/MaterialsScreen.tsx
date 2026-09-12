import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/FeedbackStates';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { StatusChip } from '../../components/common/StatusChip';
import { MaterialRequestSummary, materialService } from '../../services/materials/materialService';
import { AppStackParamList, MainTabParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { mapMaterialStatus } from '../../utils/statusMapping';

type Props = BottomTabScreenProps<MainTabParamList, 'Materials'>;
type RootNavigation = StackNavigationProp<AppStackParamList>;
export function MaterialsScreen(_: Props) {
  const rootNavigation = useNavigation<RootNavigation>();
  const [items, setItems] = useState<MaterialRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setItems(await materialService.listMyRequests()); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load material requests.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <ScreenWrapper><AppHeader title="Materials" showBack={false} /><LoadingState message="Loading material requests..." /></ScreenWrapper>;
  if (error) return <ScreenWrapper><AppHeader title="Materials" showBack={false} /><ErrorState message={error} onRetry={load} /></ScreenWrapper>;
  return (
    <ScreenWrapper>
      <AppHeader title="Materials" subtitle={`${items.length} requests`} showBack={false} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={items.length ? styles.list : styles.empty}
        renderItem={({ item }) => {
          const status = mapMaterialStatus(item.status);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => rootNavigation.navigate('MaterialApprovalStatus', { jobId: String(item.serviceOrderId), productOrderId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`Open material request ${item.id}, status ${status.label}`}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleBlock}>
                  <Text style={styles.cardTitle}>{item.storeName || 'Store not specified'}</Text>
                  <Text style={styles.requestId}>Request #{item.id}</Text>
                </View>
                <StatusChip label={status.label} type={status.tone === 'info' ? 'primary' : status.tone} />
              </View>
              <Text style={styles.amount}>₹{Number(item.totalAmount ?? 0).toFixed(0)}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<EmptyState title="No material requests yet" description="Material requests are created from an assigned job after selecting a store." icon="" />}
      />
    </ScreenWrapper>
  );
}
const styles = StyleSheet.create({
  list: { padding: spacing.layout, gap: spacing.sm },
  empty: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  titleBlock: { flex: 1 },
  cardTitle: { fontWeight: typography.fontWeight.bold, color: colors.textPrimary, fontSize: typography.fontSize.md },
  requestId: { color: colors.textMuted, fontSize: typography.fontSize.xs, marginTop: spacing.xs },
  amount: { color: colors.textPrimary, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

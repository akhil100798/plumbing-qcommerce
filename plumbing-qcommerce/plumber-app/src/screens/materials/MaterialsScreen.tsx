import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { MaterialRequestSummary, materialService } from '../../services/materials/materialService';
import { MainTabParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Materials'>;
export function MaterialsScreen({ navigation }: Props) {
  const [items, setItems] = useState<MaterialRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setItems(await materialService.listMyRequests()); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load material requests.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text>Loading material requests…</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={styles.link}>Retry</Text></TouchableOpacity></View>;
  return <View style={styles.container}><Text style={styles.title}>Materials</Text><FlatList data={items} keyExtractor={(item) => String(item.id)} contentContainerStyle={items.length ? styles.list : styles.empty} renderItem={({ item }) => <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Materials')}><Text style={styles.cardTitle}>{item.storeName || 'Store not specified'}</Text><Text>Request #{item.id} · {item.status}</Text><Text>₹{Number(item.totalAmount ?? 0).toFixed(0)}</Text></TouchableOpacity>} ListEmptyComponent={<View><Text style={styles.emptyTitle}>No material requests yet</Text><Text style={styles.emptyText}>Material requests are created from an assigned job after selecting a store.</Text></View>} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: spacing.md, backgroundColor: colors.background }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.md }, title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md }, list: { gap: spacing.sm }, empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }, card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 4 }, cardTitle: { fontWeight: typography.fontWeight.bold, color: colors.textPrimary }, emptyTitle: { color: colors.textPrimary, fontWeight: typography.fontWeight.bold, textAlign: 'center' }, emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }, error: { color: colors.danger, textAlign: 'center' }, link: { color: colors.primary, fontWeight: typography.fontWeight.bold } });

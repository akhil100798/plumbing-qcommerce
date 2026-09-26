import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import { apiClient } from '../../services/api/axiosClient';
import { MainTabParamList, AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';

interface ServiceOrderSummary { id: number; description: string; status: string; totalAmount: number | null; }
type Props = BottomTabScreenProps<MainTabParamList, 'Jobs'>;
type RootNavigation = StackNavigationProp<AppStackParamList>;
export function JobsScreen(_: Props) {
  const navigation = useNavigation<RootNavigation>();
  const [jobs, setJobs] = useState<ServiceOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { const response = await apiClient.get<ServiceOrderSummary[]>('/orders/plumber'); setJobs(response.data); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load jobs.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text>Loading jobs…</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={styles.link}>Retry</Text></TouchableOpacity></View>;
  return <View style={styles.container}><Text style={styles.title}>Jobs</Text><FlatList data={jobs} keyExtractor={(job) => String(job.id)} contentContainerStyle={jobs.length ? styles.list : styles.empty} renderItem={({ item }) => <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ActiveJob', { jobId: String(item.id) })}><Text style={styles.cardTitle}>{item.description}</Text><Text>{item.status}</Text><Text>₹{Number(item.totalAmount ?? 0).toFixed(0)}</Text></TouchableOpacity>} ListEmptyComponent={<View><Text style={styles.emptyTitle}>No jobs assigned yet</Text><Text style={styles.emptyText}>New jobs assigned to you will appear here.</Text></View>} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: spacing.md, backgroundColor: colors.background }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.md }, title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md }, list: { gap: spacing.sm }, empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }, card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 4 }, cardTitle: { fontWeight: typography.fontWeight.bold, color: colors.textPrimary }, emptyTitle: { color: colors.textPrimary, fontWeight: typography.fontWeight.bold, textAlign: 'center' }, emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }, error: { color: colors.danger, textAlign: 'center' }, link: { color: colors.primary, fontWeight: typography.fontWeight.bold } });

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import { apiClient } from '../../services/api/axiosClient';
import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/FeedbackStates';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { StatusChip } from '../../components/common/StatusChip';
import { MainTabParamList, AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { mapJobStatus } from '../../utils/statusMapping';

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
  if (loading) return <ScreenWrapper><AppHeader title="Jobs" showBack={false} /><LoadingState message="Loading assigned jobs..." /></ScreenWrapper>;
  if (error) return <ScreenWrapper><AppHeader title="Jobs" showBack={false} /><ErrorState message={error} onRetry={load} /></ScreenWrapper>;
  return (
    <ScreenWrapper>
      <AppHeader title="Jobs" subtitle={`${jobs.length} assigned`} showBack={false} />
      <FlatList
        data={jobs}
        keyExtractor={(job) => String(job.id)}
        contentContainerStyle={jobs.length ? styles.list : styles.empty}
        renderItem={({ item }) => {
          const status = mapJobStatus(item.status);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ActiveJob', { jobId: String(item.id) })}
              accessibilityRole="button"
              accessibilityLabel={`Open job ${item.description}, status ${status.label}`}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.description || 'Service job'}</Text>
                <StatusChip label={status.label} type={status.tone === 'info' ? 'primary' : status.tone} />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.jobId}>Job #{item.id}</Text>
                <Text style={styles.amount}>₹{Number(item.totalAmount ?? 0).toFixed(0)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<EmptyState title="No jobs assigned yet" description="New jobs assigned to you will appear here." icon="" />}
      />
    </ScreenWrapper>
  );
}
const styles = StyleSheet.create({
  list: { padding: spacing.layout, gap: spacing.sm },
  empty: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { flex: 1, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, fontSize: typography.fontSize.md },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  jobId: { color: colors.textMuted, fontSize: typography.fontSize.xs },
  amount: { color: colors.success, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

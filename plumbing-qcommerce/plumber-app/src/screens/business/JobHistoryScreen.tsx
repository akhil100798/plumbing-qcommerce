import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ActiveJobIcon from '../../assets/icons/active-job.svg';
import { AppHeader } from '../../components/common/AppHeader';
import { apiClient } from '../../services/api/axiosClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'JobHistory' | any>;

const FILTERS = ['All', 'Completed', 'Cancelled'] as const;

interface HistoryJob {
  id: string;
  title: string;
  amount: number;
  status: string;
  time: string;
}

export function JobHistoryScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.ORDERS.PLUMBER_ASSIGNED);
      const orders = response.data || [];
      const mapped: HistoryJob[] = orders.map((o: any) => ({
        id: `#${o.id}`,
        title: o.requestType || o.description || 'Plumbing Service',
        amount: Number(o.totalAmount || o.serviceCharge || 0),
        status: o.status === 'COMPLETED' || o.status === 'PAID' ? 'Completed' : o.status === 'CANCELLED' ? 'Cancelled' : o.status,
        time: o.completedAt ? new Date(o.completedAt).toLocaleDateString() : 'Recent',
      }));
      setJobs(mapped);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filteredJobs = useMemo(
    () => (filter === 'All' ? jobs : jobs.filter((j) => j.status === filter)),
    [filter, jobs]
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Job History" onBackPress={() => navigation?.goBack()} />

      <View style={styles.tabRow}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching Job History...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const isCancelled = item.status === 'Cancelled';
            return (
              <TouchableOpacity style={styles.row} activeOpacity={0.7}>
                <View style={[styles.iconCircle, isCancelled && { backgroundColor: '#FEE2E2' }]}>
                  <ActiveJobIcon
                    width={16}
                    height={16}
                    stroke={isCancelled ? colors.error : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobId}>{item.id}</Text>
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  <Text style={styles.jobAmount}>₹{item.amount}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.badge, { color: isCancelled ? colors.error : colors.success }]}>
                    {item.status}
                  </Text>
                  <Text style={styles.jobTime}>{item.time}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No historical jobs in this category.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#FAF9FD' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: 4,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primaryContainer || colors.primary },
  tabLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  tabLabelActive: { color: '#FFFFFF', fontWeight: typography.fontWeight.bold },
  list: { padding: spacing.md, paddingBottom: spacing.giant },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    ...shadows.sm,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  jobId: { fontSize: typography.fontSize.xs, color: colors.textMuted },
  jobTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginTop: 2 },
  jobAmount: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  jobTime: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 4 },
  badge: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  separator: { height: spacing.sm },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.giant },
  emptyIcon: { fontSize: 32, marginBottom: spacing.xs },
  emptyText: { fontSize: typography.fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});

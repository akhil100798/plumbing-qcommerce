import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import ActiveJobIcon from '../../assets/icons/active-job.svg';

type Props = StackScreenProps<AppStackParamList, 'JobHistory' | any>;

const FILTERS = ['All', 'Completed', 'Cancelled'] as const;

const JOBS = [
  {
    id: '#JKA2315',
    title: 'Bathroom Pipe Leakage',
    amount: 450,
    status: 'Completed',
    time: 'Today, 12:30 PM',
  },
  {
    id: '#JKA2110',
    title: 'Tap Installation',
    amount: 300,
    status: 'Completed',
    time: 'Yesterday',
  },
  {
    id: '#JKA3006',
    title: 'Drain Cleaning',
    amount: 350,
    status: 'Completed',
    time: '2 days ago',
  },
  {
    id: '#JKA0681',
    title: 'Water Tank Repair',
    amount: 900,
    status: 'Cancelled',
    time: '3 days ago',
  },
];

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === 'Completed';
  return (
    <Text style={[styles.badge, { color: isCompleted ? colors.success : colors.error }]}>{status}</Text>
  );
}

function JobRow({ job }: { job: (typeof JOBS)[0] }) {
  const isCancelled = job.status === 'Cancelled';
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.6}>
      <View style={[styles.iconCircle, isCancelled && { backgroundColor: '#FEE2E2' }]}>
        <ActiveJobIcon
          width={16}
          height={16}
          stroke={isCancelled ? colors.error : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.jobId}>{job.id}</Text>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobAmount}>₹{job.amount}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <StatusBadge status={job.status} />
        <Text style={styles.jobTime}>{job.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function JobHistoryScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const filteredJobs = useMemo(
    () => (filter === 'All' ? JOBS : JOBS.filter((j) => j.status === filter)),
    [filter]
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

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobRow job={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>No jobs in this category yet.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  tabLabelActive: { color: '#FFFFFF', fontWeight: typography.fontWeight.bold },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DBEAFE',
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
  empty: { fontSize: typography.fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { SvgActionCheck, SvgPlumbWrench } from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'JobHistory' | any>;

const FILTERS = ['All', 'Completed', 'Cancelled'] as const;

const JOBS = [
  {
    id: '#JKA3215',
    title: 'Bathroom Pipe Leakage',
    amount: 450,
    status: 'Completed',
    time: 'Today, 10:45 AM',
  },
  {
    id: '#JKA2110',
    title: 'Tap Installation',
    amount: 350,
    status: 'Completed',
    time: 'Yesterday',
  },
  {
    id: '#JKA1005',
    title: 'Drain Cleaning',
    amount: 600,
    status: 'Completed',
    time: '2 days ago',
  },
  {
    id: '#JKA0888',
    title: 'Water Tank Repair',
    amount: 1200,
    status: 'Cancelled',
    time: '3 days ago',
  },
];

function JobRow({ job, onPress }: { job: (typeof JOBS)[0]; onPress?: () => void }) {
  const isCompleted = job.status === 'Completed';
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.cardLeft}>
        <View style={styles.iconCircle}>
          <SvgPlumbWrench width={18} height={18} stroke={colors.stitchBlue} fill="none" />
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.jobId}>{job.id}</Text>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobAmount}>₹{job.amount}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, isCompleted ? styles.badgeSuccess : styles.badgeDanger]}>
          <Text style={[styles.statusText, isCompleted ? styles.statusSuccessText : styles.statusDangerText]}>
            {job.status}
          </Text>
        </View>
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
      <AppHeader
        title="Job History"
        variant="blue"
        onBackPress={() => navigation?.goBack()}
      />

      {/* Stitch Category Filter Pills */}
      <View style={styles.filterBar}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobRow
            job={item}
            onPress={() => {
              const numId = item.id.replace('#JKA', '').replace('#', '');
              navigation?.navigate('ActiveJob', { jobId: numId });
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: colors.stitchBlue,
    ...shadows.sm,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardMeta: {
    flex: 1,
  },
  jobId: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
    lineHeight: 18,
  },
  jobAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.stitchBlue,
    marginTop: 4,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusSuccessText: {
    color: '#059669',
  },
  statusDangerText: {
    color: '#DC2626',
  },
  jobTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

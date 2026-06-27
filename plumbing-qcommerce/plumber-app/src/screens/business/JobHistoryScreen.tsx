import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { JobHistoryCard } from '../../components/cards/JobHistoryCard';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'JobHistory' | any>;

interface HistoryJobItem {
  jobId: string;
  customerName: string;
  dateTime: string;
  status: 'Completed' | 'Cancelled';
  rating?: number;
  amount: number;
}

const HISTORICAL_JOBS: HistoryJobItem[] = [
  {
    jobId: 'PC123456',
    customerName: 'Akhil Verma',
    dateTime: 'Today, 11:30 AM',
    status: 'Completed',
    rating: 5.0,
    amount: 554,
  },
  {
    jobId: 'PC123455',
    customerName: 'Mahesh Reddy',
    dateTime: 'Today, 09:20 AM',
    status: 'Completed',
    rating: 4.8,
    amount: 299,
  },
  {
    jobId: 'PC123454',
    customerName: 'Sneha Patel',
    dateTime: 'Yesterday, 05:30 PM',
    status: 'Completed',
    rating: 5.0,
    amount: 349,
  },
  {
    jobId: 'PC123453',
    customerName: 'Ramesh Kumar',
    dateTime: 'Yesterday, 04:10 PM',
    status: 'Cancelled',
    amount: 199,
  },
];

type FilterType = 'Completed' | 'Cancelled' | 'All';

export function JobHistoryScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<FilterType>('Completed');

  const filteredJobs = HISTORICAL_JOBS.filter((job) => {
    if (filter === 'All') return true;
    return job.status === filter;
  });

  return (
    <ScreenWrapper>
      <AppHeader title="Job History" onBackPress={() => navigation.goBack()} />
      
      <View style={styles.container}>
        {/* Toggle Filters */}
        <View style={styles.filterRow}>
          {(['Completed', 'Cancelled', 'All'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterTab, filter === type && styles.filterTabActive]}
              onPress={() => setFilter(type)}
            >
              <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.jobId}
          renderItem={({ item }) => (
            <JobHistoryCard
              jobId={item.jobId}
              customerName={item.customerName}
              dateTime={item.dateTime}
              status={item.status}
              rating={item.rating}
              amount={item.amount}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No historical jobs found.</Text>
            </View>
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.layout,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.surface,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.giant,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
});

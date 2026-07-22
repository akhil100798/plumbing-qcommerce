import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { BarChart } from '../../components/common/BarChart';
import { earningsService } from '../../services/earnings/earningsService';
import { setEarningsData } from '../../redux/slices/earningsSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'Earnings' | any>;

const TREND_DATA = [
  { label: 'Mon', value: 900 },
  { label: 'Tue', value: 1100 },
  { label: 'Wed', value: 1600 },
  { label: 'Thu', value: 1550 },
  { label: 'Fri', value: 1200 },
  { label: 'Sat', value: 1300 },
  { label: 'Sun', value: 1000 },
];

export function EarningsScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const earnings = useSelector((state: RootState) => state.earnings);
  const [period, setPeriod] = useState<'This Week' | 'This Month' | 'All Time'>('This Week');

  useEffect(() => {
    const fetchEarningsStats = async () => {
      try {
        const data = await earningsService.fetchEarnings();
        dispatch(setEarningsData(data));
      } catch (err) {
        console.error('Error fetching earnings details:', err);
      }
    };
    fetchEarningsStats();
  }, [dispatch]);

  const totalDisplay = period === 'This Month' ? '₹34,600' : period === 'All Time' ? '₹1,24,500' : `₹${earnings.weeklyEarnings || '8,650'}`;
  const jobsCount = period === 'This Month' ? 56 : period === 'All Time' ? 180 : 14;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Earnings" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Total Earnings Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <View style={styles.periodPill}>
              {(['This Week', 'This Month', 'All Time'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pillItem, period === p && styles.pillItemActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.pillText, period === p && styles.pillTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={styles.summaryAmount}>{totalDisplay}</Text>
          <View style={styles.growthRow}>
            <Text style={styles.growthText}>📈 12% from last period</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed Jobs</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{jobsCount}</Text>
              <Text style={styles.statDelta}>↑ 12%</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Average Earning</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>₹950</Text>
              <Text style={styles.statDelta}>↑ 8%</Text>
            </View>
          </View>
        </View>

        {/* BarChart Trend */}
        <View style={styles.trendCard}>
          <Text style={styles.trendTitle}>Earnings Trend</Text>
          <BarChart data={TREND_DATA} />
        </View>

        {/* Navigation Button */}
        <TouchableOpacity
          style={styles.walletBtn}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Text style={styles.walletBtnText}>View Wallet & Transactions ➔</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.md, paddingBottom: spacing.xl },
  summaryCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.md,
  },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: typography.fontSize.xs },
  periodPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.sm,
    padding: 2,
  },
  pillItem: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  pillItemActive: {
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.fontWeight.medium,
  },
  pillTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.bold,
  },
  summaryAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: typography.fontWeight.black, marginTop: spacing.xs },
  growthRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  growthText: { color: '#86EFAC', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  statValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statDelta: { fontSize: typography.fontSize.xs, color: colors.success, fontWeight: typography.fontWeight.bold },
  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  trendTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  walletBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  walletBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

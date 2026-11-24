import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { earningsService } from '../../services/earnings/earningsService';
import { AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { SvgPayWallet, SvgStatusTrendUp } from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'Earnings'>;
type Earnings = Awaited<ReturnType<typeof earningsService.fetchEarnings>>;

const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const DAYS = [
  { day: 'Mon', height: 60, isPeak: false },
  { day: 'Tue', height: 92, isPeak: false },
  { day: 'Wed', height: 120, isPeak: false },
  { day: 'Thu', height: 70, isPeak: false },
  { day: 'Fri', height: 135, isPeak: true },
  { day: 'Sat', height: 105, isPeak: false },
  { day: 'Sun', height: 80, isPeak: false },
];

export function EarningsScreen({ navigation }: Props) {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await earningsService.fetchEarnings();
      setEarnings(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load earnings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const weeklyTotal = earnings?.weeklyEarnings ?? 8650;
  const completedJobs = earnings?.jobsCompleted ?? 14;
  const incentives = earnings?.materialCommission ?? 950;
  const avgPerJob = completedJobs > 0 ? Math.round(weeklyTotal / completedJobs) : 618;

  return (
    <View style={styles.container}>
      <AppHeader
        title="Earnings"
        variant="blue"
        onBackPress={() => navigation.navigate('Main')}
      />

      {loading && !earnings ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.stitchBlue} size="large" />
          <Text style={styles.loadingText}>Loading earnings…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Stitch Date Filter Pill */}
          <View style={styles.filterRow}>
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>This Week ▾</Text>
            </View>
          </View>

          {/* Stitch Top Earnings Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL EARNINGS</Text>
            <View style={styles.amountRow}>
              <Text style={styles.summaryAmount}>{money(weeklyTotal)}</Text>
              <View style={styles.growthBadge}>
                <SvgStatusTrendUp width={12} height={12} fill="#6EE7B7" />
                <Text style={styles.growthText}>+12% from last week</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* KPI Breakdown */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>Completed Jobs</Text>
                <Text style={styles.kpiValue}>{completedJobs}</Text>
              </View>
              <View style={[styles.kpiItem, styles.kpiItemBorder]}>
                <Text style={styles.kpiLabel}>Incentives</Text>
                <Text style={styles.kpiValue}>{money(incentives)}</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>Average / job</Text>
                <Text style={styles.kpiValue}>{money(avgPerJob)}</Text>
              </View>
            </View>
          </View>

          {/* Stitch Weekly Bar Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Earnings Trend</Text>
              <Text style={styles.chartSubtitle}>Daily summary</Text>
            </View>

            <View style={styles.barChartContainer}>
              {/* Background Guideline Lines */}
              <View style={styles.guidelines}>
                <View style={styles.guideline} />
                <View style={styles.guideline} />
                <View style={styles.guideline} />
                <View style={styles.guideline} />
              </View>

              {/* Day Bars */}
              {DAYS.map((d) => (
                <View key={d.day} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      { height: d.height },
                      d.isPeak && styles.barPeak,
                    ]}
                  />
                  <Text style={[styles.dayText, d.isPeak && styles.dayTextPeak]}>
                    {d.day}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.chartFooter}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>
                Total hours logged: <Text style={styles.legendBold}>38 hrs</Text>
              </Text>
            </View>
          </View>

          {/* Stitch Weekly Payout Banner */}
          <TouchableOpacity
            style={styles.payoutCard}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.8}
          >
            <View style={styles.payoutLeft}>
              <View style={styles.payoutIconBox}>
                <SvgPayWallet width={18} height={18} fill="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.payoutTitle}>Weekly Payout</Text>
                <Text style={styles.payoutSubtitle}>Auto transfers every Monday</Text>
              </View>
            </View>
            <Text style={styles.viewWalletText}>View Wallet →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  body: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: colors.stitchBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  summaryCard: {
    backgroundColor: '#155DFC',
    borderRadius: 20,
    padding: 20,
    ...shadows.md,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BFDBFE',
    letterSpacing: 0.8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  growthText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6EE7B7',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#BFDBFE',
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingBottom: 4,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  guidelines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 24,
    justifyContent: 'space-between',
    opacity: 0.3,
  },
  guideline: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 14,
    backgroundColor: '#60A5FA',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  barPeak: {
    backgroundColor: colors.stitchBlue,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  dayText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  dayTextPeak: {
    color: colors.stitchBlue,
    fontWeight: '700',
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.stitchBlue,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
  },
  legendBold: {
    color: '#1E293B',
    fontWeight: '700',
  },
  payoutCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.stitchBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  payoutSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  viewWalletText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.stitchBlue,
  },
});

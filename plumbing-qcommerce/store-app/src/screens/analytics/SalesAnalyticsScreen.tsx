import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { StoreIcon } from '../../components/common/StoreIcon';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface CategoryShare {
  name: string;
  pct: number;
  color: string;
  amount: string;
}

const categories: CategoryShare[] = [
  { name: 'Plumbing Fittings', pct: 44, color: '#1E4FD8', amount: '₹1,53,420' },
  { name: 'Pipes & Tubing', pct: 28, color: '#F59E0B', amount: '₹97,630' },
  { name: 'Valves & Controls', pct: 18, color: '#10B981', amount: '₹62,760' },
  { name: 'Adhesives & Tapes', pct: 10, color: '#94A3B8', amount: '₹34,870' },
];

const periods = ['This Month (1 - 31 Mar)', 'Last Month (Feb)', 'Last 90 Days'];

export function SalesAnalyticsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);

  const togglePeriod = () => {
    setSelectedPeriodIdx((prev) => (prev + 1) % periods.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'HomeTab' } as any);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Period Filter Dropdown Chip */}
        <View style={styles.periodRow}>
          <TouchableOpacity style={styles.periodChip} onPress={togglePeriod} activeOpacity={0.7}>
            <Text style={styles.periodChipText}>{periods[selectedPeriodIdx]}</Text>
            <StoreIcon name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 3-Column Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          {/* Total Sales */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sales</Text>
            <Text style={styles.metricValue}>₹3,48,680</Text>
            <View style={styles.trendRow}>
              <StoreIcon name="success" size={10} color="#059669" />
              <Text style={styles.trendPositive}>+12%</Text>
            </View>
          </View>

          {/* Total Orders */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Counter Orders</Text>
            <Text style={styles.metricValue}>236</Text>
            <View style={styles.trendRow}>
              <StoreIcon name="success" size={10} color="#059669" />
              <Text style={styles.trendPositive}>+8%</Text>
            </View>
          </View>

          {/* Avg Order Value */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg. Order Value</Text>
            <Text style={styles.metricValue}>₹1,478</Text>
            <View style={styles.trendRow}>
              <StoreIcon name="success" size={10} color="#059669" />
              <Text style={styles.trendPositive}>+6%</Text>
            </View>
          </View>
        </View>

        {/* Sales Overview Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.cardTitle}>Sales Overview</Text>
              <Text style={styles.cardSubtitle}>Counter fulfillment revenue trend</Text>
            </View>
            <StoreIcon name="chart" size={20} color={colors.primary} />
          </View>

          {/* Bar Chart Visualization */}
          <View style={styles.barChartContainer}>
            {[
              { day: '1 Mar', val: 45, amt: '₹45K' },
              { day: '7 Mar', val: 72, amt: '₹72K' },
              { day: '14 Mar', val: 58, amt: '₹58K' },
              { day: '21 Mar', val: 90, amt: '₹90K' },
              { day: '28 Mar', val: 68, amt: '₹68K' },
              { day: '31 Mar', val: 84, amt: '₹84K' },
            ].map((col, idx) => (
              <View key={idx} style={styles.barColumn}>
                <Text style={styles.barAmt}>{col.amt}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${col.val}%` }]} />
                </View>
                <Text style={styles.barDay}>{col.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Selling Categories */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.cardTitle}>Top Selling Categories</Text>
              <Text style={styles.cardSubtitle}>Counter pickup product mix</Text>
            </View>
            <StoreIcon name="inventory" size={20} color={colors.primary} />
          </View>

          {/* Progress Breakdown Bars */}
          <View style={styles.categoriesList}>
            {categories.map((c) => (
              <View key={c.name} style={styles.categoryItem}>
                <View style={styles.categoryInfoRow}>
                  <View style={styles.categoryNameCol}>
                    <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                    <Text style={styles.categoryName}>{c.name}</Text>
                  </View>
                  <View style={styles.categoryValuesRow}>
                    <Text style={styles.categoryAmt}>{c.amount}</Text>
                    <Text style={styles.categoryPct}>({c.pct}%)</Text>
                  </View>
                </View>
                <View style={styles.categoryProgressTrack}>
                  <View
                    style={[
                      styles.categoryProgressFill,
                      { width: `${c.pct}%`, backgroundColor: c.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  periodRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 6,
    letterSpacing: -0.2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  trendPositive: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 16,
    paddingBottom: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barAmt: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  barDay: {
    fontSize: 9.5,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  categoriesList: {
    gap: 14,
  },
  categoryItem: {
    gap: 6,
  },
  categoryInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryAmt: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryPct: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  categoryProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default SalesAnalyticsScreen;

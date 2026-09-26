import React from 'react';
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
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import { colors, borderRadius, spacing, typography } from '../../theme';

const categories = [
  { name: 'Plumbing', pct: 48, color: colors.primary },
  { name: 'Electrical', pct: 26, color: colors.accentOrange },
  { name: 'Hardware', pct: 16, color: colors.accentGreen },
  { name: 'Other', pct: 10, color: colors.textMuted },
];

export function SalesAnalyticsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Month selector */}
          <TouchableOpacity style={styles.monthSelector}>
            <Text style={styles.monthSelectorText}>This Month (May 1 – May 21)</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>▼</Text>
          </TouchableOpacity>

          {/* Stat cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={styles.statValue}>₹3,48,680</Text>
              <View style={styles.trendRow}>
                <Text style={styles.trendText}>↑ 8% <Text style={styles.trendMuted}>vs last month</Text></Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Orders</Text>
              <Text style={styles.statValue}>236</Text>
              <View style={styles.trendRow}>
                <Text style={styles.trendText}>↑ 12% <Text style={styles.trendMuted}>vs last month</Text></Text>
              </View>
            </View>
          </View>

          {/* Sales Overview */}
          <Text style={styles.sectionTitle}>Sales Overview</Text>
          <View style={styles.chartCard}>
            <View style={styles.salesBarChart}>
              {[42, 55, 48, 60, 52, 68, 63].map((val, idx) => (
                <View key={idx} style={styles.barColumn}>
                  <View style={[styles.barFill, { height: `${val}%` }]} />
                  <Text style={styles.barLabel}>{['1M', '3M', '7M', '10M', '14M', '18M', '21M'][idx]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top Selling Categories */}
          <Text style={styles.sectionTitle}>Top Selling Categories</Text>
          <View style={styles.chartCard}>
            <View style={styles.legendList}>
              {categories.map((c) => (
                <View key={c.name} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendLabel}>{c.name}</Text>
                  <Text style={styles.legendPct}>{c.pct}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    height: 46,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthSelectorText: { fontSize: 13, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  statValue: { fontSize: 19, fontWeight: typography.fontWeight.black, color: colors.textPrimary, marginVertical: 6 },
  trendRow: { flexDirection: 'row', alignItems: 'center' },
  trendText: { fontSize: 11, fontWeight: '700', color: colors.accentGreen },
  trendMuted: { color: colors.textMuted, fontWeight: '400' },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  salesBarChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 20,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 14,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },
  legendList: { width: '100%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendLabel: { flex: 1, fontSize: typography.fontSize.xs, color: colors.textPrimary },
  legendPct: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
});

export default SalesAnalyticsScreen;

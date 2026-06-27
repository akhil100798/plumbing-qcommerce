import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';

// ==========================================
// ANALYTICS METRIC CARD
// ==========================================
interface AnalyticsMetricCardProps {
  label: string;
  value: string;
  change: string;
  isPositive?: boolean;
}

export const AnalyticsMetricCard: React.FC<AnalyticsMetricCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
}) => {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={styles.changeRow}>
        <Text style={[styles.changeText, { color: isPositive ? colors.success : colors.danger }]}>
          {isPositive ? '▲' : '▼'} {change}
        </Text>
        <Text style={styles.changeLabel}> vs last week</Text>
      </View>
    </View>
  );
};

// ==========================================
// LINE CHART CARD (CUSTOM FLEX GRAPH)
// ==========================================
interface DataPoint {
  label: string;
  value: number;
}

interface LineChartCardProps {
  title: string;
  dataPoints: DataPoint[];
  yAxisLabelPrefix?: string;
}

export const LineChartCard: React.FC<LineChartCardProps> = ({
  title,
  dataPoints,
  yAxisLabelPrefix = '',
}) => {
  const maxVal = Math.max(...dataPoints.map(d => d.value), 1);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      
      {/* Graph Area */}
      <View style={styles.graphArea}>
        {dataPoints.map((dp, i) => {
          const barHeightPercentage = (dp.value / maxVal) * 80 + 10; // between 10% and 90%
          
          return (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barTrack}>
                {/* Visual bar graph stack imitating continuous dots/lines */}
                <View style={[styles.activeBar, { height: `${barHeightPercentage}%` as any }]}>
                  {/* Indicator Dot at peak */}
                  <View style={styles.indicatorDot} />
                </View>
              </View>
              <Text style={styles.barLabel}>{dp.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.bold,
  },
  metricValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  changeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  changeLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // LineChartCard
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  chartTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  graphArea: {
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 6,
    height: 120,
    backgroundColor: colors.background,
    borderRadius: 3,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activeBar: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
  },
  indicatorDot: {
    position: 'absolute',
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.card,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
});

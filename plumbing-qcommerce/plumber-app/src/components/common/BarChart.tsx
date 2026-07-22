import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface BarData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
}

export function BarChart({ data, height = 110 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.chartArea, { height }]}>
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / max) * height, 4);
          return (
            <View key={i} style={styles.barColumn}>
              <View style={[styles.bar, { height: barHeight }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.labelRow}>
        {data.map((d, i) => (
          <Text key={i} style={styles.label}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  barColumn: { flex: 1, alignItems: 'center' },
  bar: {
    width: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.primary,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
});

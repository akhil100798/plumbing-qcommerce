import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, spacing, typography } from '../../theme';

export interface BarData {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
}

export function BarChart({ data, height = 120 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 24;
  const gap = 12;
  const chartWidth = Math.max(data.length * (barWidth + gap), 280);
  const chartHeight = height - 24;

  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / max) * chartHeight, 4);
          const x = i * (barWidth + gap) + gap / 2;
          const y = chartHeight - barHeight;
          return (
            <Rect
              key={`${d.label}-${i}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={6}
              fill={d.highlight ? colors.primary : colors.primaryLight}
            />
          );
        })}
      </Svg>
      <View style={styles.labelRow}>
        {data.map((d, i) => (
          <Text key={`${d.label}-${i}`} style={styles.label}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    width: 28,
    textAlign: 'center',
  },
});

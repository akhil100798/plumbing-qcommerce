import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';
import { ActiveJob } from '../../types';

interface ActiveJobCardProps {
  job: ActiveJob;
}

export function ActiveJobCard({ job }: ActiveJobCardProps) {
  const steps = [
    { id: 'accepted', label: 'Accepted', time: job.timeline.accepted },
    { id: 'on_the_way', label: 'On the way', time: job.timeline.on_the_way },
    { id: 'reached', label: 'Arrived', time: job.timeline.reached },
    { id: 'started', label: 'Started', time: job.timeline.started },
    { id: 'completed', label: 'Completed', time: job.timeline.completed },
  ] as const;

  const currentStatusIndex = steps.findIndex((step) => step.id === job.status);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Task Timeline</Text>
      
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isDone = index <= currentStatusIndex || job.status === 'completed';
          const isCurrent = step.id === job.status;

          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.dot,
                    isDone && styles.dotDone,
                    isCurrent && styles.dotCurrent,
                  ]}
                />
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      index < currentStatusIndex && styles.lineDone,
                    ]}
                  />
                )}
              </View>
              
              <View style={styles.contentCol}>
                <Text
                  style={[
                    styles.label,
                    isDone && styles.labelDone,
                    isCurrent && styles.labelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
                {step.time ? (
                  <Text style={styles.time}>{step.time}</Text>
                ) : (
                  <Text style={styles.timePending}>Pending</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  timeline: {
    paddingLeft: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  indicatorCol: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.borderDark,
    borderWidth: 2.5,
    borderColor: colors.surface,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  lineDone: {
    backgroundColor: colors.success,
  },
  contentCol: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
  },
  labelDone: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  labelCurrent: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timePending: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface TrackingStatusStepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
  style?: any;
}

export function TrackingStatusStepper({
  steps,
  currentStep,
  style,
}: TrackingStatusStepperProps) {
  return (
    <View style={[styles.container, style]}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <View key={step} style={styles.stepRow}>
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.completedCircle,
                  isActive && styles.activeCircle,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkText}>✓</Text>
                ) : (
                  <View style={[styles.innerDot, isActive && styles.activeInnerDot]} />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    isCompleted && styles.completedLine,
                  ]}
                />
              )}
            </View>
            <View style={styles.contentCol}>
              <Text
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                  isCompleted && styles.completedLabel,
                ]}
              >
                {step}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: spacing.md,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  completedCircle: {
    borderColor: colors.success || '#006E1C',
    backgroundColor: colors.success || '#006E1C',
  },
  activeCircle: {
    borderColor: colors.primaryContainer || colors.primary,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderDark || '#727785',
  },
  activeInnerDot: {
    backgroundColor: colors.primaryContainer || colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border || '#C1C6D6',
    position: 'absolute',
    top: 20,
    bottom: 0,
    zIndex: 1,
  },
  completedLine: {
    backgroundColor: colors.success || '#006E1C',
  },
  contentCol: {
    flex: 1,
    paddingTop: 1,
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
  },
  activeLabel: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
  completedLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
  },
});

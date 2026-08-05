import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import CheckIcon from '../../assets/icons/success-check.svg';

interface JobProgressStepperProps {
  currentStepIndex: number;
  onStepPress?: (index: number) => void;
  steps?: string[];
}

const DEFAULT_STEPS = ['Accepted', 'On the Way', 'Reached', 'In Progress', 'Completed'];

export function JobProgressStepper({
  currentStepIndex,
  onStepPress,
  steps = DEFAULT_STEPS,
}: JobProgressStepperProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Job Progress</Text>
      <View style={styles.stepperRow}>
        {steps.map((step, index) => {
          const isDone = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <React.Fragment key={step}>
              <TouchableOpacity
                activeOpacity={onStepPress ? 0.7 : 1}
                onPress={() => onStepPress && onStepPress(index)}
                style={styles.stepItem}
              >
                <View
                  style={[
                    styles.circle,
                    isDone ? styles.circleDone : styles.circlePending,
                    isCurrent && styles.circleCurrent,
                  ]}
                >
                  {isDone ? (
                    <CheckIcon width={12} height={12} stroke="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone && styles.stepLabelDone,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                  numberOfLines={2}
                >
                  {step}
                </Text>
              </TouchableOpacity>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    index < currentStepIndex ? styles.lineDone : styles.linePending,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  circleDone: {
    backgroundColor: colors.primary,
  },
  circlePending: {
    backgroundColor: colors.border,
  },
  circleCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  stepLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  stepLabelDone: {
    color: colors.textPrimary,
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  connectorLine: {
    height: 2,
    flex: 0.8,
    marginTop: 11,
  },
  lineDone: {
    backgroundColor: colors.primary,
  },
  linePending: {
    backgroundColor: colors.border,
  },
});

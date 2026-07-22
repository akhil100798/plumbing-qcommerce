import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import CheckIcon from '../../assets/icons/success-check.svg';

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export function ChecklistItem({ label, checked, onToggle }: ChecklistItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.container}
      onPress={onToggle}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <CheckIcon width={12} height={12} stroke="#FFFFFF" />}
      </View>
      <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.xs,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  labelChecked: {
    color: colors.textSecondary,
  },
});

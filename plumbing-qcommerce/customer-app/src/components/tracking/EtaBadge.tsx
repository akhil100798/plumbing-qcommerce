import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, spacing, typography } from '../../theme';
import ClockIcon from '../../assets/icons/clock.svg';
import { AppIcon } from '../common/AppIcon';

interface EtaBadgeProps {
  timeText: string;
  style?: any;
}

export function EtaBadge({ timeText, style }: EtaBadgeProps) {
  return (
    <View style={[styles.container, style]}>
      <AppIcon icon={ClockIcon} size={12} color="#FFFFFF" />
      <Text style={styles.text}>{timeText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A', // Slate 900
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.xxs,
  },
});

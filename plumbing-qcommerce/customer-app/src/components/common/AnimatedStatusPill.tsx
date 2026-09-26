import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../theme';

interface AnimatedStatusPillProps {
  text: string;
  status: 'success' | 'warning' | 'error' | 'info' | 'active';
  style?: any;
}

export function AnimatedStatusPill({ text, status, style }: AnimatedStatusPillProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'active' || status === 'info') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  let bg = colors.border;
  let fg = colors.textSecondary;

  if (status === 'success') {
    bg = colors.successLight;
    fg = colors.success;
  } else if (status === 'warning') {
    bg = colors.warningLight;
    fg = colors.warning;
  } else if (status === 'error') {
    bg = colors.errorLight;
    fg = colors.error;
  } else if (status === 'active' || status === 'info') {
    bg = colors.primaryLight;
    fg = colors.primary;
  }

  return (
    <Animated.View
      style={[
        styles.pill,
        { backgroundColor: bg, opacity: pulseAnim },
        style,
      ]}
    >
      <Text style={[styles.text, { color: fg }]}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

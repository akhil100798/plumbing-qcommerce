import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';

interface Props {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export function AnimatedChecklistItem({ label, checked, onToggle }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (checked) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [checked]);

  return (
    <TouchableOpacity style={styles.container} onPress={onToggle} activeOpacity={0.7}>
      <Animated.View style={[
        styles.checkbox,
        checked && styles.checkedBox,
        { transform: [{ scale }] }
      ]}>
        {checked && <SuccessCheckIcon width={16} height={16} stroke={colors.card} />}
      </Animated.View>
      <Text style={[styles.label, checked && styles.checkedText]}>{label}</Text>
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
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  checkedBox: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  checkedText: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});

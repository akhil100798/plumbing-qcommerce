import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { borderRadius, colors, shadows } from '../../theme';

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<TextStyle>;
  size?: number;
}

export function IconButton({
  icon,
  onPress,
  style,
  iconStyle,
  size = 44,
}: IconButtonProps) {
  const effectiveSize = Math.max(size, 44);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { width: effectiveSize, height: effectiveSize, borderRadius: effectiveSize / 2, minWidth: 44, minHeight: 44 },
        style,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.icon, { fontSize: effectiveSize * 0.45 }, iconStyle]}>
        {icon}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: colors.border,
  },
  icon: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
});

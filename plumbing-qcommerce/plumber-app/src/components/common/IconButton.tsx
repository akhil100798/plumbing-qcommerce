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
  size = 40,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        style,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.icon, { fontSize: size * 0.45 }, iconStyle]}>
        {icon}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
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

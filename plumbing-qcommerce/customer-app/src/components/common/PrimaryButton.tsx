import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { animation } from '../../theme/animation';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  success?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  success = false,
  iconLeft,
  iconRight,
  style,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isInteractionDisabled = disabled || loading || success;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: animation.pressScale,
      useNativeDriver: true,
      speed: 100,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: style ? undefined : 'auto' }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isInteractionDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        style={({ pressed }) => [
          styles.button,
          success && styles.successButton,
          style,
          isInteractionDisabled && !success && styles.disabledButton,
          pressed && !isInteractionDisabled && styles.pressedButton,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.surface} size="small" />
        ) : success ? (
          <View style={styles.contentRow}>
            <Text style={styles.text}>✓ Success</Text>
          </View>
        ) : (
          <View style={styles.contentRow}>
            {iconLeft && <View style={styles.iconLeftContainer}>{iconLeft}</View>}
            <Text style={styles.text}>{title}</Text>
            {iconRight && <View style={styles.iconRightContainer}>{iconRight}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    minWidth: 132,
    ...shadows.sm,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    backgroundColor: colors.primaryDark,
  },
  text: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeftContainer: {
    marginRight: spacing.xs,
  },
  iconRightContainer: {
    marginLeft: spacing.xs,
  },
});

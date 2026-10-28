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
import { animation, useNativeDriver } from '../../theme/animation';
import { SvgJobComplete } from '../../assets/svg';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  success?: boolean;
  variant?: 'blue' | 'green' | 'danger';
  icon?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  success = false,
  variant = 'blue',
  icon,
  iconLeft,
  iconRight,
  style,
  accessibilityLabel,
  testID,
}: PrimaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isInteractionDisabled = disabled || loading || success;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: animation.pressScale,
      useNativeDriver,
      speed: 100,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver,
      speed: 100,
      bounciness: 4,
    }).start();
  };

  const getVariantStyle = () => {
    if (variant === 'green') return styles.greenButton;
    if (variant === 'danger') return styles.dangerButton;
    return styles.blueButton;
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: style ? undefined : 'auto' }}>
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isInteractionDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        style={({ pressed }) => [
          styles.button,
          getVariantStyle(),
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
            <SvgJobComplete width={18} height={18} stroke="#FFFFFF" fill="none" style={{ marginRight: 6 }} />
            <Text style={styles.text}>Success</Text>
          </View>
        ) : (
          <View style={styles.contentRow}>
            {iconLeft && <View style={styles.iconLeftContainer}>{iconLeft}</View>}
            <Text style={styles.text}>{title}</Text>
            {(iconRight || icon) && <View style={styles.iconRightContainer}>{iconRight || icon}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    minWidth: 132,
    ...shadows.sm,
  },
  blueButton: {
    backgroundColor: '#0755E9',
  },
  greenButton: {
    backgroundColor: '#009B45',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  successButton: {
    backgroundColor: '#009B45',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  text: {
    color: '#FFFFFF',
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

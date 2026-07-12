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

import { borderRadius, colors, spacing, typography } from '../../theme';
import { animation } from '../../theme/animation';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  outlineColor?: string;
  textColor?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function SecondaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  outlineColor = colors.primary,
  textColor = colors.primary,
  iconLeft,
  iconRight,
  style,
  accessibilityLabel,
}: SecondaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isInteractionDisabled = disabled || loading;

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
          { borderColor: outlineColor },
          style,
          isInteractionDisabled && styles.disabledButton,
          pressed && !isInteractionDisabled && { backgroundColor: colors.primaryLight },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {iconLeft && <View style={styles.iconLeftContainer}>{iconLeft}</View>}
            <Text style={[styles.text, { color: textColor }]}>{title}</Text>
            {iconRight && <View style={styles.iconRightContainer}>{iconRight}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    minWidth: 132,
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
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

import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { animation } from '../../theme/animation';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedIconButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  accessibilityLabel: string;
}

export function AnimatedIconButton({
  children,
  onPress,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: AnimatedIconButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();

  const handlePressIn = () => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: animation.pressScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.container,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});

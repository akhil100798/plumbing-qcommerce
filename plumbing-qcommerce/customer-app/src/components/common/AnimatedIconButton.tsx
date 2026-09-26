import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { animation } from '../../theme/animation';

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

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: animation.pressScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
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

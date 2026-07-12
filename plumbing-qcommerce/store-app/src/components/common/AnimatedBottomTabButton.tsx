import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

interface AnimatedBottomTabButtonProps {
  onPress?: () => void;
  accessibilityState?: any;
  children: React.ReactNode;
  style?: any;
}

export function AnimatedBottomTabButton({
  onPress,
  accessibilityState,
  children,
  style,
}: AnimatedBottomTabButtonProps) {
  const focused = accessibilityState?.selected;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.spring(scale, {
        toValue: 1.1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [focused, scale]);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, style]}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

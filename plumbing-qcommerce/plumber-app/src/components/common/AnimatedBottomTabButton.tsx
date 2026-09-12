import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

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
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
    } else if (focused) {
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
  }, [focused, scale, reduceMotion]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
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

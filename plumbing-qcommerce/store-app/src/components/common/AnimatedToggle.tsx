import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View, Animated } from 'react-native';
import { colors } from '../../theme';

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function AnimatedToggle({ value, onValueChange }: Props) {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const toggleTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const toggleColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', colors.success],
  });

  return (
    <TouchableWithoutFeedback onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.container, { backgroundColor: toggleColor }]}>
        <Animated.View style={[styles.circle, { transform: [{ translateX: toggleTranslate }] }]} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 2,
  },
});

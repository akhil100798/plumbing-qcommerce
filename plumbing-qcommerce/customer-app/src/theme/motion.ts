import { Animated } from 'react-native';

export const motion = {
  duration: {
    micro: 100,
    quick: 140,
    normal: 220,
    slow: 280,
    transition: 320,
    decorative: 1000,
  },
  easing: {
    press: 'ease-out',
    fade: 'ease-out',
    slide: 'ease-in-out',
    spring: 'spring' as const,
  },
  pressScale: 0.97,
  pressOpacity: 0.85,
};

export const animatePress = (animatedValue: Animated.Value, callback?: () => void) => {
  Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: motion.pressScale,
      duration: motion.duration.micro,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: motion.duration.micro,
      useNativeDriver: true,
    }),
  ]).start(callback);
};

export const animateFadeIn = (animatedValue: Animated.Value, duration = motion.duration.normal) => {
  Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  }).start();
};
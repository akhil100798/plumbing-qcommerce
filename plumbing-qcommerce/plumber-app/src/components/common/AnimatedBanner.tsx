import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { SecondaryButton } from './SecondaryButton';

interface AnimatedBannerProps {
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
  ctaText?: string;
  onCtaPress?: () => void;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  textColor?: string;
  subtitleColor?: string;
}

export function AnimatedBanner({
  title,
  subtitle,
  illustration,
  ctaText,
  onCtaPress,
  style,
  backgroundColor = colors.primary,
  textColor = '#FFFFFF',
  subtitleColor = '#DBEAFE',
}: AnimatedBannerProps) {
  const entranceFade = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(-15)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(entranceSlide, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [entranceFade, entranceSlide, floatAnim]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor,
          opacity: entranceFade,
          transform: [{ translateY: entranceSlide }],
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
          {ctaText && onCtaPress && (
            <SecondaryButton
              title={ctaText}
              onPress={onCtaPress}
              outlineColor="#FFFFFF"
              textColor="#FFFFFF"
              style={styles.ctaButton}
            />
          )}
        </View>

        <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }] }]}>
          {illustration}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    minHeight: 140,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1.3,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  ctaButton: {
    height: 38,
    minWidth: 100,
    paddingVertical: 0,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

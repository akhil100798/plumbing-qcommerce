import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { borderRadius, spacing } from '../../theme';

interface LoadingSkeletonCardProps {
  height?: number;
  style?: any;
}

export function LoadingSkeletonCard({ height = 100, style }: LoadingSkeletonCardProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={[styles.card, { height }, style]}>
      <Animated.View style={[styles.shimmer, { opacity: pulseAnim, flex: 1 }]}>
        <View style={styles.thumbnail} />
        <View style={styles.textBlock}>
          <View style={styles.titleLine} />
          <View style={styles.subtitleLine} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F1F5F9', // Slate 100
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  shimmer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: '#CBD5E1', // Slate 300
    marginRight: spacing.md,
  },
  textBlock: {
    flex: 1,
    height: 60,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
  },
  titleLine: {
    width: '60%',
    height: 16,
    borderRadius: borderRadius.xs,
    backgroundColor: '#CBD5E1',
  },
  subtitleLine: {
    width: '90%',
    height: 12,
    borderRadius: borderRadius.xs,
    backgroundColor: '#CBD5E1',
  },
});

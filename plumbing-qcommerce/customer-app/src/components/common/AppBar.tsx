import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../theme';

export interface AppBarProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'primary' | 'surface';
  style?: StyleProp<ViewStyle>;
}

export function AppBar({
  title,
  subtitle,
  onBackPress,
  rightAction,
  variant = 'surface',
  style,
}: AppBarProps) {
  const isPrimary = variant === 'primary';
  const bgColor = isPrimary
    ? colors.primary || '#005BBF'
    : colors.surfaceContainerLowest || '#FFFFFF';
  const textColor = isPrimary
    ? colors.onPrimary || '#FFFFFF'
    : colors.textPrimary || '#0B1C30';
  const subtitleColor = isPrimary
    ? colors.primaryLight || '#D8E2FF'
    : colors.textSecondary || '#414754';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      {onBackPress ? (
        <Pressable
          onPress={onBackPress}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backIcon, { color: textColor }]}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightAction ? (
        <View style={styles.rightActionContainer}>{rightAction}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  rightActionContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
});

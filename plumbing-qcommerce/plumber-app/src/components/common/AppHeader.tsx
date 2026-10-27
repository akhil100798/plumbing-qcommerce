import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { SvgNavArrowLeft } from '../../assets/svg';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  showBack?: boolean;
  variant?: 'blue' | 'green' | 'white' | 'darkBlue';
}

export function AppHeader({
  title,
  subtitle,
  onBackPress,
  rightElement,
  showBack = true,
  variant = 'white',
}: AppHeaderProps) {
  const isColored = variant !== 'white';
  const headerBg =
    variant === 'blue'
      ? '#0B5CDA'
      : variant === 'green'
      ? '#0EA454'
      : variant === 'darkBlue'
      ? '#002885'
      : colors.surface;

  const textColor = isColored ? '#FFFFFF' : colors.textPrimary;
  const subtitleColor = isColored ? 'rgba(255, 255, 255, 0.8)' : colors.textSecondary;
  const iconColor = isColored ? '#FFFFFF' : colors.textPrimary;

  return (
    <View style={[styles.container, { backgroundColor: headerBg }]}>
      {showBack && onBackPress ? (
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={onBackPress}
        >
          <SvgNavArrowLeft width={22} height={22} stroke={iconColor} fill="none" />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement ? (
        <View style={styles.rightContainer}>{rightElement}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
  rightContainer: {
    minWidth: 32,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 32,
  },
});

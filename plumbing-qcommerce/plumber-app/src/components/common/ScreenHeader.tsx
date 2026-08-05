import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import { colors, typography, spacing } from '../../theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  onBackPress?: () => void;
  variant?: 'primary' | 'success';
  rightIcon?: string;
  onRightPress?: () => void;
}

export function ScreenHeader({
  title,
  onBack,
  onBackPress,
  variant = 'primary',
  rightIcon,
  onRightPress,
}: ScreenHeaderProps) {
  const bg = variant === 'success' ? colors.success : colors.primary;
  const handleBack = onBack || onBackPress;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.side}>
        {handleBack ? (
          <TouchableOpacity onPress={handleBack} hitSlop={hitSlop} accessibilityLabel="Go back">
            <ArrowLeftIcon width={22} height={22} stroke="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.side, styles.rightSide]}>
        {rightIcon && onRightPress ? (
          <TouchableOpacity onPress={onRightPress} hitSlop={hitSlop} accessibilityLabel="Action">
            <Text style={styles.rightText}>⚙</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  side: {
    width: 32,
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  rightText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../../theme';

interface AppHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  showBack?: boolean;
}

export function AppHeader({
  title,
  onBackPress,
  rightElement,
  showBack = true,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {showBack && onBackPress ? (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  rightContainer: {
    minWidth: 32,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 32,
  },
});

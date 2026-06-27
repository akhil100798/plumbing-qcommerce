import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../../theme';

interface ProfileMenuItemProps {
  title: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export function ProfileMenuItem({
  title,
  onPress,
  rightElement,
}: ProfileMenuItemProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      
      {rightElement ? (
        rightElement
      ) : (
        <Text style={styles.chevron}>➔</Text>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 14,
    color: colors.textMuted,
  },
});

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface SearchBarProps {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  editable?: boolean;
}

export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onFocus,
  editable = true,
}: SearchBarProps) {
  return (
    <Pressable style={styles.container} onPress={onFocus}>
      <Text style={styles.searchIcon}>🔍</Text>
      {editable ? (
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          autoCorrect={false}
        />
      ) : (
        <Text style={styles.placeholderText}>{placeholder}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    padding: 0,
  },
  placeholderText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
});

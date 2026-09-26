import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface ChatInputProps {
  value: string;
  onChangeText: (val: string) => void;
  onSend: () => void;
}

export function ChatInput({ value, onChangeText, onSend }: ChatInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        multiline
      />
      <TouchableOpacity
        style={[styles.sendBtn, !value.trim() && styles.sendBtnDisabled]}
        onPress={onSend}
        disabled={!value.trim()}
      >
        <Text style={styles.sendIcon}>➔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.borderDark,
    opacity: 0.6,
  },
  sendIcon: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

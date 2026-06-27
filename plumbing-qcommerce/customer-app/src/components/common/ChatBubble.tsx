import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface ChatBubbleProps {
  id: string;
  text: string;
  time: string;
  sender: 'user' | 'partner';
}

export function ChatBubble({ text, time, sender }: ChatBubbleProps) {
  const isUser = sender === 'user';
  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperPartner]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubblePartner]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textPartner]}>
          {text}
        </Text>
        <Text style={[styles.time, isUser ? styles.timeUser : styles.timePartner]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    width: '100%',
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperPartner: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderBottomRightRadius: 2,
  },
  bubblePartner: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderBottomLeftRadius: 2,
  },
  text: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    fontWeight: typography.fontWeight.medium,
  },
  textUser: {
    color: colors.surface,
  },
  textPartner: {
    color: colors.textPrimary,
  },
  time: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: typography.fontWeight.bold,
  },
  timeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timePartner: {
    color: colors.textMuted,
  },
});

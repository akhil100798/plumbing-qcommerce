import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../components/common/AppHeader';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { colors, spacing, typography, borderRadius } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Chat'>;

interface MessageItem {
  id: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

export function ChatScreen({ route, navigation }: Props) {
  const { name, role } = route.params;

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: '1',
      sender: 'other',
      text: `Hello! I need plumbing work. Are you arriving soon?`,
      time: '10:18 AM',
    },
    {
      id: '2',
      sender: 'me',
      text: `Hi! Yes, I have accepted the request and am en route. Will reach in 10 minutes.`,
      time: '10:19 AM',
    },
  ]);

  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: MessageItem = {
      id: String(Date.now()),
      sender: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Auto reply simulation for customer
    if (role === 'Customer') {
      setTimeout(() => {
        const reply: MessageItem = {
          id: String(Date.now() + 1),
          sender: 'other',
          text: `Okay, thank you! I will be waiting.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, reply]);
      }, 2000);
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.surface }}>
      <AppHeader title={name} onBackPress={() => navigation.goBack()} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isMe = item.sender === 'me';
            return (
              <View style={[styles.msgRow, isMe ? styles.rowMe : styles.rowOther]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={[styles.msgText, isMe ? styles.textMe : styles.textOther]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeOther]}>
                    {item.time}
                  </Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Chat Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    width: '100%',
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.tight,
  },
  textMe: {
    color: colors.surface,
  },
  textOther: {
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: colors.primaryLight,
  },
  timeOther: {
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  sendText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});

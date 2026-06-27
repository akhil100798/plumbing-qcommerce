import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ChatBubble } from '../components/common/ChatBubble';
import { ChatInput } from '../components/common/ChatInput';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Chat'>;

interface MessageItem {
  id: string;
  text: string;
  time: string;
  sender: 'user' | 'partner';
}

export function ChatScreen({ route, navigation }: Props) {
  const { name, role } = route.params;
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initial welcome message from partner
    setMessages([
      {
        id: '1',
        text: `Hello! I am your ${role.toLowerCase()}, ${name}. I am heading to your location now. Please let me know if you have any entry codes or landmarks!`,
        time: 'Just now',
        sender: 'partner',
      },
    ]);
  }, [name, role]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: MessageItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      time: 'Just now',
      sender: 'user',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulate mock reply after 1.5 seconds
    setTimeout(() => {
      const replyMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        text: 'Understood. I will call you once I arrive outside.',
        time: 'Just now',
        sender: 'partner',
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1500);
  };

  const handleCall = () => {
    Linking.openURL('tel:+919876543210').catch(() =>
      alert('Failed to initiate phone call. Dialer not supported.')
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerName}>{name}</Text>
              <Text style={styles.headerSub}>{role} • Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Text style={styles.callEmoji}>📞</Text>
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              id={item.id}
              text={item.text}
              time={item.time}
              sender={item.sender}
            />
          )}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Chat Entry Input */}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  headerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callEmoji: {
    fontSize: 16,
  },
  listContent: {
    padding: spacing.layout,
    paddingBottom: spacing.md,
  },
});

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
  Alert,
} from 'react-native';

import { ChatBubble } from '../components/common/ChatBubble';
import { ChatInput } from '../components/common/ChatInput';
import { canUseDevMockFallbacks } from '../services/mockPolicy';
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
  const devMode = canUseDevMockFallbacks();

  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: devMode
          ? `Hello! I am your ${role.toLowerCase()}, ${name}. I am heading to your location now.`
          : `Live ${role.toLowerCase()} chat is not available in staging. Please use phone support if you need to contact ${name}.`,
        time: 'Just now',
        sender: 'partner',
      },
    ]);
  }, [name, role, devMode]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (!devMode) {
      Alert.alert('Feature unavailable', 'Live chat messaging is not available in staging.');
      return;
    }

    const newMsg: MessageItem = { id: Date.now().toString(), text: inputText.trim(), time: 'Just now', sender: 'user' };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      const replyMsg: MessageItem = { id: (Date.now() + 1).toString(), text: 'Understood. I will call you once I arrive outside.', time: 'Just now', sender: 'partner' };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <View style={styles.header}>
          <View style={styles.leftRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>?</Text></TouchableOpacity>
            <View><Text style={styles.headerName}>{name}</Text><Text style={styles.headerSub}>{role} • {devMode ? 'Demo chat' : 'Unavailable in staging'}</Text></View>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL('tel:+919876543210').catch(() => Alert.alert('Failed to initiate phone call.'))}><Text style={styles.callEmoji}>??</Text></TouchableOpacity>
        </View>

        {!devMode && (
          <View style={styles.noticeCard}><Text style={styles.noticeText}>Live chat replies are disabled in staging to avoid fake support or delivery confirmations.</Text></View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble id={item.id} text={item.text} time={item.time} sender={item.sender} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <ChatInput value={inputText} onChangeText={setInputText} onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.layout, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1.5, borderBottomColor: colors.border },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  backButtonText: { fontSize: 22, color: colors.textPrimary, fontWeight: 'bold' },
  headerName: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  headerSub: { fontSize: 10, color: colors.textSecondary, fontWeight: typography.fontWeight.medium, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  callEmoji: { fontSize: 16 },
  noticeCard: { margin: spacing.layout, marginBottom: 0, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md },
  noticeText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  listContent: { padding: spacing.layout, paddingBottom: spacing.md },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAuth } from '../../services/authService';
import { useOrders } from '../../services/orderService';
import { ChevronLeftIcon, WrenchIcon, PhoneCallIcon } from '../../assets/svg/Icons';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

interface SupportChatScreenProps {
  onBack: () => void;
}

export const SupportChatScreen: React.FC<SupportChatScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { activeOrder } = useOrders();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_1',
      sender: 'bot',
      text: `Hello ${user?.name || 'Customer'}! 👋 Welcome to FixKart 24/7 Priority Support. How can we assist you with your plumbing booking today?`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const quickReplies = [
    'Where is my plumber?',
    'Need to reschedule service',
    'Request material invoice',
    'Warranty claim question',
  ];

  const handleSend = (textToSend?: string) => {
    const msg = textToSend || inputText;
    if (!msg.trim()) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: msg,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Bot Auto-Response
    setTimeout(() => {
      let replyText = activeOrder
        ? `Our support specialist is reviewing your inquiry. Your booking #${activeOrder.orderNumber} is active with status: ${activeOrder.statusLabel}.`
        : 'Our customer support team is available 24/7. Please let us know how we can assist you with your plumbing inquiries.';

      if (msg.includes('Where')) {
        replyText = activeOrder?.plumber
          ? `Your assigned plumber ${activeOrder.plumber.name} is on the way (${activeOrder.statusLabel}).`
          : 'Your service request has been received and FixKart is assigning the nearest certified plumber.';
      } else if (msg.includes('reschedule')) {
        replyText = 'You can reschedule your slot directly from the booking detail screen or reply with your preferred date and time.';
      } else if (msg.includes('invoice')) {
        replyText = 'Digital GST invoices are automatically generated and sent to your registered email upon service completion.';
      }

      const botReply: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: replyText,
        time: 'Just now',
      };
      setMessages((prev) => [...prev, botReply]);
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back button">
          <ChevronLeftIcon size={22} color={colors.onBackground} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.botAvatar}>
            <WrenchIcon size={16} color="#ffffff" />
          </View>
          <View style={styles.botTextCol}>
            <Text style={styles.botName}>FixKart Support Assistant</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online • Typically replies in 1m</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.callSupportBtn} activeOpacity={0.8} accessibilityLabel="Call Support">
          <PhoneCallIcon size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.supportBadgeRow}>
          <Text style={styles.supportBadgeText}>FixKart Priority 24x7 Customer Care</Text>
        </View>

        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <View
              key={m.id}
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                {m.text}
              </Text>
              <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
                {m.time}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Quick Suggestion Chips */}
      <View style={styles.quickRepliesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickReplies.map((q, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickChip}
              onPress={() => handleSend(q)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Message Input Box */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={colors.outline}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.disabledSendBtn]}
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  botTextCol: {
    flex: 1,
  },
  botName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onBackground,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 10,
    color: colors.secondary,
  },
  callSupportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  supportBadgeRow: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  supportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.secondary,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  botBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: colors.onBackground,
    lineHeight: 18,
  },
  userMessageText: {
    color: colors.onPrimary,
  },
  messageTime: {
    fontSize: 9,
    color: colors.outline,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  quickRepliesContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  quickChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryFixed,
  },
  quickChipText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.onBackground,
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  disabledSendBtn: {
    backgroundColor: colors.outlineVariant,
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 14,
  },
});

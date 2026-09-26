import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SupportOptionCard } from '../components/cards/SupportOptionCard';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Support'>;

interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export function SupportScreen({ navigation }: Props) {
  const [faqs, setFaqs] = useState<FaqItem[]>([
    {
      id: 'f1',
      q: 'How fast will the plumber arrive?',
      a: 'Our quick plumber service matches you with the closest verified local expert. Average arrival time is between 10 to 15 minutes.',
    },
    {
      id: 'f2',
      q: 'What if the plumber requires extra materials?',
      a: 'If a repair requires parts (e.g. CPVC pipes, elbow joints, valves), the plumber will request them directly on their app. This appears as a "Material Approval" card in your app. Once paid, the supplies are delivered to your door in 15 minutes via our delivery network.',
    },
    {
      id: 'f3',
      q: 'How do returns and refunds work?',
      a: 'Any unused materials or cancelled bookings will be refunded instantly back into your PlumbCommerce Wallet. You can transfer wallet balances back to your bank account anytime.',
    },
    {
      id: 'f4',
      q: 'Are plumber inspection fees fixed?',
      a: 'Yes, the base inspection and diagnosis fee is fixed at ₹199. Any extra labor or material pricing is fully itemized and approved by you in the app before work begins.',
    },
  ]);

  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Contact Channels</Text>
        <SupportOptionCard
          icon="💬"
          title="Chat with Us"
          description="Initiate an emergency live chat session with support agents"
          onPress={() => alert('Launching customer live support chat...')}
        />
        <SupportOptionCard
          icon="📞"
          title="Call Support"
          description="Speak to our 24/7 helpdesk helpline at +1-800-PLUMBCO"
          onPress={() => alert('Dialing +1-800-PLUMBCO emergency helpline...')}
        />
        <SupportOptionCard
          icon="🎟️"
          title="Raise a Ticket"
          description="Report issues regarding order delivery shortages or service delays"
          onPress={() => alert('Opening ticket registration forms...')}
        />

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Frequently Asked Questions</Text>
        {faqs.map((faq) => {
          const expanded = expandedFaqId === faq.id;
          return (
            <View key={faq.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={styles.faqArrow}>{expanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  faqQuestion: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  faqArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  faqAnswerContainer: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  faqAnswer: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});

import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Alert,
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
  const [faqs] = useState<FaqItem[]>([
    {
      id: 'f1',
      q: 'How fast will the plumber arrive?',
      a: 'Our emergency plumber dispatch matches you with the closest verified local expert. Average arrival time is between 10 to 15 minutes.',
    },
    {
      id: 'f2',
      q: 'What if the repair requires extra materials?',
      a: 'If a repair requires hardware parts (e.g. CPVC pipes, elbow joints, valves), your plumber will inspect the issue and submit a material request. Once approved by you, the items are prepared by our partner hardware store and collected directly by your plumber.',
    },
    {
      id: 'f3',
      q: 'How do service order cancellations work?',
      a: 'You can cancel a service request directly from the order details screen anytime before the plumber begins inspection or requests materials.',
    },
    {
      id: 'f4',
      q: 'Are plumber inspection fees fixed?',
      a: 'Yes, the base inspection and diagnosis charge is transparently displayed before booking. Any additional labor or material costs are itemized and approved by you before work begins.',
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
          title="Customer Helpdesk"
          description="Contact FixKart customer support for active booking assistance"
          onPress={() => Alert.alert('Support Helpdesk', 'Connecting to FixKart Customer Support...')}
        />
        <SupportOptionCard
          icon="📞"
          title="Helpline Call"
          description="Speak to our customer support team at +91-1800-FIXKART"
          onPress={() => Alert.alert('Helpline', 'Dialing +91-1800-FIXKART helpline...')}
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
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
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
    fontFamily: typography.fontFamily.body,
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
    borderTopColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
  },
  faqAnswer: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});

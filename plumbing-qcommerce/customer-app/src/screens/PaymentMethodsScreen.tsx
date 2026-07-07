import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { canUseDevMockFallbacks } from '../services/mockPolicy';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'PaymentMethods'>;

export function PaymentMethodsScreen({ navigation }: Props) {
  const devMode = canUseDevMockFallbacks();
  const showUnavailable = () => Alert.alert('Feature unavailable', 'Payment method updates are not available in staging.');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>?</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Saved payment methods</Text>
          <Text style={styles.noticeText}>Live card, wallet, and payment-method mutation APIs are not available in staging.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current staging behavior</Text>
          <Text style={styles.bullet}>• Card add/remove is disabled</Text>
          <Text style={styles.bullet}>• Wallet link/unlink is disabled</Text>
          <Text style={styles.bullet}>• Real payment methods will appear only when backend support exists</Text>
        </View>

        {devMode && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dev-only demo mode</Text>
            <Text style={styles.noticeText}>Local demo payment method mutations remain available only with dev mocks enabled.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.disabledAction} onPress={showUnavailable}>
          <Text style={styles.disabledActionText}>Manage Payment Methods</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.layout, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  backButtonText: { fontSize: 22, color: colors.textPrimary, fontWeight: 'bold' },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  scrollContent: { padding: spacing.layout, paddingBottom: spacing.huge, gap: spacing.md },
  noticeCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md },
  noticeTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  noticeText: { fontSize: typography.fontSize.xs, color: colors.textSecondary, lineHeight: typography.lineHeight.tight },
  card: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  bullet: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  disabledAction: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  disabledActionText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
});

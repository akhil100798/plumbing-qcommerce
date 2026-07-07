import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { canUseDevMockFallbacks } from '../services/mockPolicy';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Payment'>;
interface PaymentOption { id: string; title: string; subtitle: string; icon: string; }

const paymentOptions: PaymentOption[] = [
  { id: 'upi', title: 'UPI', subtitle: 'Pay using any UPI app', icon: '??' },
  { id: 'card', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', icon: '??' },
  { id: 'wallet', title: 'Wallets', subtitle: 'PhonePe, Paytm, Amazon Pay', icon: '??' },
  { id: 'cod', title: 'Cash on Delivery', subtitle: 'Pay cash when delivered', icon: '??' },
];

export function PaymentScreen({ route, navigation }: Props) {
  const { totalAmount } = route.params;
  const [selectedId, setSelectedId] = useState('upi');
  const [loading, setLoading] = useState(false);
  const devMode = canUseDevMockFallbacks();

  const handlePay = () => {
    if (!devMode) {
      Alert.alert('Feature unavailable', 'Checkout payment confirmation is not available in staging.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('OrderConfirmation', {
        orderId: Math.floor(100000 + Math.random() * 900000),
        totalAmount,
        address: 'Flat 402, Block A, Green Meadows Apartments, Madhapur, Hyderabad, 500081',
        eta: '15-20 mins',
      });
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>?</Text></TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
      </View>

      <View style={styles.stepperContainer}>
        <View style={styles.step}><View style={styles.stepDot}><Text style={styles.stepNumber}>1</Text></View><Text style={styles.stepLabel}>Address</Text></View>
        <View style={styles.stepLine} />
        <View style={styles.step}><View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepNumber}>2</Text></View><Text style={styles.stepLabelActive}>Payment</Text></View>
        <View style={styles.stepLine} />
        <View style={styles.step}><View style={styles.stepDot}><Text style={styles.stepNumber}>3</Text></View><Text style={styles.stepLabel}>Confirm</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!devMode && (
          <View style={styles.noticeCard}><Text style={styles.noticeTitle}>Staging limitation</Text><Text style={styles.noticeText}>Payment confirmation is disabled to avoid fake order success. Use backend-supported cart flows only.</Text></View>
        )}

        <Text style={styles.sectionHeader}>PAYMENT METHODS</Text>
        <View style={styles.optionsList}>
          {paymentOptions.map((opt) => {
            const selected = selectedId === opt.id;
            return (
              <TouchableOpacity key={opt.id} style={[styles.card, selected && styles.cardSelected]} onPress={() => setSelectedId(opt.id)} activeOpacity={0.8}>
                <View style={styles.iconWrapper}><Text style={styles.icon}>{opt.icon}</Text></View>
                <View style={styles.copy}><Text style={styles.cardTitle}>{opt.title}</Text><Text style={styles.cardSubtitle}>{opt.subtitle}</Text></View>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>{selected && <View style={styles.radioInner} />}</View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title={devMode ? `Pay ?${totalAmount}` : 'Checkout unavailable in staging'} onPress={handlePay} loading={loading} style={styles.payBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.layout, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  backButtonText: { fontSize: 22, color: colors.textPrimary, fontWeight: 'bold' },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  stepperContainer: { flexDirection: 'row', backgroundColor: colors.surface, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: colors.border },
  step: { alignItems: 'center', gap: 4 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.borderDark, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: colors.primary },
  stepNumber: { fontSize: 12, color: colors.surface, fontWeight: 'bold' },
  stepLabel: { fontSize: 10, color: colors.textMuted, fontWeight: typography.fontWeight.bold },
  stepLabelActive: { fontSize: 10, color: colors.primary, fontWeight: typography.fontWeight.bold },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: spacing.sm, marginBottom: 14 },
  scrollContent: { padding: spacing.layout, paddingBottom: spacing.huge },
  noticeCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  noticeTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  noticeText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  sectionHeader: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textSecondary, marginBottom: spacing.sm, letterSpacing: 0.5 },
  optionsList: { gap: spacing.sm },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  cardSelected: { borderColor: colors.primary },
  iconWrapper: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  icon: { fontSize: 20 },
  copy: { flex: 1 },
  cardTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  cardSubtitle: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontWeight: typography.fontWeight.medium, marginTop: 2 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderDark, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  footer: { padding: spacing.layout, borderTopWidth: 1.5, borderTopColor: colors.border, backgroundColor: colors.surface },
  payBtn: { width: '100%' },
});

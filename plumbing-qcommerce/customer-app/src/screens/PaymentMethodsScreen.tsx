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

import { PrimaryButton } from '../components/common/PrimaryButton';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'PaymentMethods'>;

interface UpiItem {
  id: string;
  vpa: string;
  isDefault: boolean;
}

interface CardItem {
  id: string;
  bank: string;
  type: 'Visa' | 'Mastercard' | 'RuPay';
  last4: string;
  expiry: string;
}

interface WalletItem {
  id: string;
  name: string;
  balance: number;
  linked: boolean;
}

export function PaymentMethodsScreen({ navigation }: Props) {
  const [upis, setUpis] = useState<UpiItem[]>([
    { id: 'u1', vpa: 'akhil.kumar@okhdfc', isDefault: true },
    { id: 'u2', vpa: '9876543210@paytm', isDefault: false },
  ]);

  const [cards, setCards] = useState<CardItem[]>([
    { id: 'c1', bank: 'HDFC Bank', type: 'Visa', last4: '4321', expiry: '12/28' },
    { id: 'c2', bank: 'ICICI Bank', type: 'Mastercard', last4: '8765', expiry: '05/30' },
  ]);

  const [wallets, setWallets] = useState<WalletItem[]>([
    { id: 'w1', name: 'PlumbCommerce Wallet', balance: 500, linked: true },
    { id: 'w2', name: 'Paytm Wallet', balance: 120, linked: true },
    { id: 'w3', name: 'PhonePe Wallet', balance: 0, linked: false },
  ]);

  const handleAddUpi = () => {
    const vpa = prompt('Enter UPI ID (e.g. user@okaxis):');
    if (vpa && vpa.trim().includes('@')) {
      setUpis([...upis, { id: Date.now().toString(), vpa: vpa.trim(), isDefault: false }]);
    } else if (vpa) {
      alert('Invalid UPI ID format.');
    }
  };

  const handleAddCard = () => {
    // Mock card addition
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    setCards([
      ...cards,
      { id: Date.now().toString(), bank: 'SBI Bank', type: 'RuPay', last4, expiry: '08/32' },
    ]);
    alert('Mock Card Added Successfully.');
  };

  const toggleWalletLink = (id: string) => {
    setWallets(
      wallets.map((w) => {
        if (w.id === id) {
          return { ...w, linked: !w.linked, balance: !w.linked ? 250 : 0 };
        }
        return w;
      })
    );
  };

  const removeUpi = (id: string) => {
    setUpis(upis.filter((u) => u.id !== id));
  };

  const removeCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* UPI section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>UPI Accounts</Text>
          <TouchableOpacity onPress={handleAddUpi}>
            <Text style={styles.addText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {upis.map((upi) => (
          <View key={upi.id} style={styles.card}>
            <View style={styles.leftRow}>
              <Text style={styles.upiIcon}>📱</Text>
              <View>
                <Text style={styles.upiVpa}>{upi.vpa}</Text>
                {upi.isDefault && <Text style={styles.tagText}>Default</Text>}
              </View>
            </View>
            <TouchableOpacity onPress={() => removeUpi(upi.id)}>
              <Text style={styles.actionText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Cards section */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>Credit & Debit Cards</Text>
          <TouchableOpacity onPress={handleAddCard}>
            <Text style={styles.addText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {cards.map((card) => (
          <View key={card.id} style={styles.card}>
            <View style={styles.leftRow}>
              <Text style={styles.upiIcon}>💳</Text>
              <View>
                <Text style={styles.cardBank}>{card.bank} {card.type}</Text>
                <Text style={styles.cardDigits}>•••• •••• •••• {card.last4}</Text>
                <Text style={styles.cardExp}>Exp: {card.expiry}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeCard(card.id)}>
              <Text style={styles.actionText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Wallets section */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>Digital Wallets</Text>
        </View>

        {wallets.map((w) => (
          <View key={w.id} style={styles.card}>
            <View style={styles.leftRow}>
              <Text style={styles.upiIcon}>💼</Text>
              <View>
                <Text style={styles.cardBank}>{w.name}</Text>
                {w.linked ? (
                  <Text style={styles.walletBalance}>Balance: ₹{w.balance}</Text>
                ) : (
                  <Text style={styles.cardExp}>Not linked</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.linkBtn, w.linked ? styles.linkBtnActive : {}]}
              onPress={() => toggleWalletLink(w.id)}
            >
              <Text style={[styles.linkBtnText, w.linked ? styles.linkBtnTextActive : {}]}>
                {w.linked ? 'Unlink' : 'Link'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  upiIcon: {
    fontSize: 24,
  },
  upiVpa: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 2,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
  },
  cardBank: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  cardDigits: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardExp: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: 'bold',
  },
  walletBalance: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  linkBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  linkBtnActive: {
    borderColor: colors.borderDark,
    backgroundColor: colors.background,
  },
  linkBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  linkBtnTextActive: {
    color: colors.textSecondary,
  },
});

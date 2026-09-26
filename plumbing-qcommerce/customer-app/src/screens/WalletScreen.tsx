import { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { WalletCard } from '../components/cards/WalletCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { Toast } from '../components/common/Toast';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Wallet'>;

interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
}

import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { setBalance, setTransactions } from '../redux/slices/walletSlice';
import { RootState } from '../redux/store';
import { WalletRepository } from '../services/wallet/walletRepository';

export function WalletScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const balance = useSelector((state: RootState) => state.wallet.balance);
  const transactions = useSelector((state: RootState) => state.wallet.transactions);
  const [amountInput, setAmountInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [100, 200, 500];

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!isFocused) return;
    const fetchWalletData = async () => {
      try {
        const bal = await WalletRepository.getBalance();
        dispatch(setBalance(bal));
        
        const txs = await WalletRepository.getTransactions();
        dispatch(setTransactions(txs));
      } catch (err) {
        console.error('Failed to load wallet data', err);
      }
    };
    fetchWalletData();
  }, [isFocused, dispatch]);

  const handleAddMoney = async () => {
    const parsed = parseFloat(amountInput);
    if (isNaN(parsed) || parsed <= 0) {
      setToastMessage('Please enter a valid amount.');
      setToastVisible(true);
      return;
    }

    setLoading(true);
    try {
      const newBalance = await WalletRepository.topup(parsed);
      dispatch(setBalance(newBalance));
      
      const txs = await WalletRepository.getTransactions();
      dispatch(setTransactions(txs));
      
      setAmountInput('');
      setToastMessage(`Successfully added ₹${parsed} to your wallet!`);
      setToastVisible(true);
    } catch (err) {
      console.error('Failed to add money', err);
      setToastMessage('Failed to add money. Please try again.');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (amt: number) => {
    setAmountInput(amt.toString());
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WalletCard balance={balance} onAddMoney={() => {}} />

        <TouchableOpacity
          style={styles.offersPromoBanner}
          onPress={() => navigation.navigate('Offers')}
          activeOpacity={0.8}
        >
          <Text style={styles.offersPromoEmoji}>🎉</Text>
          <View style={styles.offersPromoText}>
            <Text style={styles.offersPromoTitle}>View Active Offers & Coupons</Text>
            <Text style={styles.offersPromoSub}>Save up to 50% on plumbing tools and services</Text>
          </View>
          <Text style={styles.offersPromoArrow}>→</Text>
        </TouchableOpacity>

        {/* Add Money Input form */}
        <View style={styles.addMoneySection}>
          <Text style={styles.sectionTitle}>Add Money to Wallet</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={amountInput}
              onChangeText={setAmountInput}
            />
          </View>

          <View style={styles.quickAddRow}>
            {quickAmounts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickAddChip}
                onPress={() => handleQuickAdd(amt)}
              >
                <Text style={styles.quickAddChipText}>+ ₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton
            title="Add Money"
            onPress={handleAddMoney}
            loading={loading}
            style={styles.addBtn}
          />
        </View>

        {/* Recent Transactions List */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Recent Transactions</Text>
        {transactions.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={styles.txLeft}>
              <View style={[styles.txIconCircle, tx.type === 'credit' ? styles.txCreditIcon : styles.txDebitIcon]}>
                <Text style={styles.txIconText}>{tx.type === 'credit' ? '📥' : '📤'}</Text>
              </View>
              <View>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
            </View>
            <Text style={[styles.txAmount, tx.type === 'credit' ? styles.creditAmount : styles.debitAmount]}>
              {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
            </Text>
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
  offersPromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  offersPromoEmoji: {
    fontSize: 24,
  },
  offersPromoText: {
    flex: 1,
  },
  offersPromoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  offersPromoSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  offersPromoArrow: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  addMoneySection: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  currencySymbol: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  quickAddChip: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    alignItems: 'center',
  },
  quickAddChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addBtn: {
    width: '100%',
  },
  txRow: {
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
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txCreditIcon: {
    backgroundColor: colors.successLight,
  },
  txDebitIcon: {
    backgroundColor: colors.errorLight,
  },
  txIconText: {
    fontSize: 14,
  },
  txTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  txDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: typography.fontWeight.bold,
  },
  txAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
  },
  creditAmount: {
    color: colors.success,
  },
  debitAmount: {
    color: colors.error,
  },
});

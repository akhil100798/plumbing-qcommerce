import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Alert, TextInput } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { TransactionCard } from '../../components/cards/WalletReviewsPromoCards';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { walletService } from '../../services/wallet/walletService';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchWalletStart, fetchWalletSuccess, fetchWalletFailure, updateBalance } from '../../redux/slices/walletSlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Transaction } from '../../types';

export const WalletScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();

  const { balance, transactions, loading } = useAppSelector(state => state.wallet);

  const loadWallet = async () => {
    dispatch(fetchWalletStart());
    try {
      const bal = await walletService.getBalance();
      const txs = await walletService.getTransactions();
      dispatch(fetchWalletSuccess({ balance: bal, transactions: txs }));
    } catch (e: any) {
      dispatch(fetchWalletFailure(e.message || 'Failed to sync wallet'));
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleWithdrawal = () => {
    Alert.prompt(
      'Payout Request',
      `Enter withdrawal amount (Available: ₹${balance}):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async (val) => {
            const amount = Number(val);
            if (isNaN(amount) || amount <= 0) {
              return Alert.alert('Invalid Input', 'Please enter a valid count');
            }
            if (amount > balance) {
              return Alert.alert('Insufficient Funds', 'Payout exceeds available balance');
            }

            try {
              const newBal = await walletService.withdraw(amount);
              dispatch(updateBalance(newBal));
              // Refresh full ledger to show debit row
              const txs = await walletService.getTransactions();
              dispatch(fetchWalletSuccess({ balance: newBal, transactions: txs }));
              Alert.alert('Payout Initiated', `₹${amount} transfer to registered bank account initiated.`);
            } catch (e: any) {
              Alert.alert('Request Failed', e.message || 'Unable to complete payout');
            }
          }
        }
      ],
      'plain-text',
      '5000'
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Wallet" onBack={() => navigation.goBack()} />

      <View style={styles.balanceCard}>
        <Text style={styles.cardLabel}>Available Balance</Text>
        <Text style={styles.cardVal}>₹{balance.toLocaleString('en-IN')}</Text>
        
        <PrimaryButton
          title="Withdraw to Bank"
          onPress={handleWithdrawal}
          style={styles.withdrawBtn}
          loading={loading}
        />
      </View>

      <Text style={styles.sectionHeader}>Recent Transactions</Text>

      <FlatList
        data={transactions}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadWallet}
        renderItem={({ item }) => (
          <TransactionCard transaction={item} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={styles.emptyText}>No transaction records found</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    margin: spacing.layout,
    alignItems: 'center',
    ...shadows.md,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
  },
  cardVal: {
    color: colors.card,
    fontSize: 32,
    fontWeight: typography.fontWeight.black,
    marginTop: spacing.xs,
  },
  withdrawBtn: {
    backgroundColor: colors.card,
    width: '100%',
    marginTop: spacing.lg,
  },
  // Overwriting primary button defaults for white background withdrawal button
  withdrawBtnText: {
    color: colors.primary,
  },
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginLeft: spacing.layout,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: spacing.layout,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
});
export default WalletScreen;

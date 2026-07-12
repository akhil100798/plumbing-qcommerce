import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { WalletCard } from '../../components/cards/WalletCard';
import { TransactionCard } from '../../components/cards/TransactionCard';
import { walletService } from '../../services/wallet/walletService';
import { setWalletData, addTransaction } from '../../redux/slices/walletSlice';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'Wallet' | any>;

export function WalletScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { balance, transactions } = useSelector((state: RootState) => state.wallet);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        const wallet = await walletService.getWallet();
        const txns = await walletService.getTransactions();
        dispatch(
          setWalletData({
            balance: wallet.balance,
            transactions: txns,
          })
        );
        setNotice(null);
      } catch (err) {
        console.error('Error fetching wallet details:', err);
        setNotice(err instanceof Error ? err.message : 'Wallet is not available in staging.');
      }
    };
    fetchWalletDetails();
  }, [dispatch]);

  const handleWithdraw = () => {
    if (balance <= 0) {
      Alert.alert('Insufficient Balance', 'There are no funds available in your wallet to withdraw.');
      return;
    }

    Alert.alert(
      'Request Payout',
      `Would you like to withdraw \u20B9${balance.toLocaleString()} to your registered bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Withdrawal',
          onPress: () => {
            const amount = balance;
            dispatch(
              addTransaction({
                id: `TXN${Math.floor(Math.random() * 100000)}`,
                type: 'DEBIT',
                amount: amount,
                description: 'Withdrawal to Registered Bank A/c',
                createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              })
            );
            Alert.alert('Withdrawal Successful', 'The funds will be credited to your bank account within 24 hours.');
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <AppHeader title="My Wallet" onBackPress={() => navigation.goBack()} />

      <View style={styles.container}>
        <View style={styles.walletCardContainer}>
          <WalletCard balance={balance} onWithdrawPress={handleWithdraw} />
        </View>

        {!!notice && <Text style={styles.noticeText}>{notice}</Text>}
        <Text style={styles.sectionLabel}>Recent Transactions</Text>

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent transactions found.</Text>
            </View>
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.layout,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  walletCardContainer: {
    marginBottom: spacing.lg,
  },
  noticeText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.giant,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
});

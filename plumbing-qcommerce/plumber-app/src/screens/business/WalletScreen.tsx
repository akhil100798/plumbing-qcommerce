import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { walletService } from '../../services/wallet/walletService';
import { setWalletData, addTransaction } from '../../redux/slices/walletSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { Transaction } from '../../types';

type Props = StackScreenProps<AppStackParamList, 'Wallet' | any>;

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'CREDIT' as const,
    amount: 650,
    description: 'Job Payment',
    createdAt: '10:30 AM',
  },
  {
    id: '2',
    type: 'CREDIT' as const,
    amount: 150,
    description: 'Incentive',
    createdAt: 'Yesterday',
  },
  {
    id: '3',
    type: 'DEBIT' as const,
    amount: 210,
    description: 'Material Advance',
    createdAt: 'Yesterday',
  },
  {
    id: '4',
    type: 'DEBIT' as const,
    amount: 2000,
    description: 'Withdrawal',
    createdAt: '2 days ago',
  },
];

function TransactionRow({ item }: { item: Transaction | (typeof MOCK_TRANSACTIONS)[0] }) {
  const isPositive = item.type === 'CREDIT';
  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: isPositive ? '#D1FAE5' : '#FEE2E2' }]}>
        <Text style={styles.iconSymbol}>{isPositive ? '💼' : '💸'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.description}</Text>
        <Text style={styles.rowTime}>{item.createdAt}</Text>
      </View>
      <Text style={[styles.rowAmount, { color: isPositive ? colors.success : colors.error }]}>
        {isPositive ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

export function WalletScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { balance, transactions } = useSelector((state: RootState) => state.wallet);

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
      } catch (err) {
        console.error('Error fetching wallet details:', err);
      }
    };
    fetchWalletDetails();
  }, [dispatch]);

  const handleWithdraw = () => {
    const activeBalance = balance || 3250;
    if (activeBalance <= 0) {
      Alert.alert('Insufficient Balance', 'There are no funds available in your wallet to withdraw.');
      return;
    }

    Alert.alert(
      'Request Payout',
      `Would you like to withdraw ₹${activeBalance.toLocaleString()} to your registered bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Withdrawal',
          onPress: () => {
            dispatch(
              addTransaction({
                id: `TXN${Math.floor(Math.random() * 100000)}`,
                type: 'DEBIT',
                amount: activeBalance,
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

  const listData = transactions.length > 0 ? transactions : MOCK_TRANSACTIONS;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Wallet" onBackPress={() => navigation.goBack()} />

      <View style={styles.body}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>₹{(balance || 3250).toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
            <Text style={styles.withdrawLabel}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>

        <FlatList
          data={listData as any}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity style={styles.viewAllButton} onPress={() => Alert.alert('All Transactions', 'Full transaction statement exported to your email.')}>
          <Text style={styles.viewAllLabel}>View All Transactions</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.md },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  balanceLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  balanceValue: { fontSize: 24, fontWeight: typography.fontWeight.black, color: colors.textPrimary, marginTop: 4 },
  withdrawButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  withdrawLabel: { color: '#FFFFFF', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  sectionHeaderRow: { marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  list: { backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  iconSymbol: { fontSize: 14 },
  rowTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  rowTime: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  rowAmount: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  separator: { height: 1, backgroundColor: colors.border },
  viewAllButton: { alignItems: 'center', paddingVertical: spacing.md },
  viewAllLabel: { color: colors.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
});

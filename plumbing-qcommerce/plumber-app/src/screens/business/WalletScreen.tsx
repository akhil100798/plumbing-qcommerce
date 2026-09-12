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

function TransactionRow({ item }: { item: Transaction }) {
  const isPositive = item.type === 'CREDIT';
  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: isPositive ? colors.successLight : colors.errorLight }]}>
        <Text style={styles.iconSymbol}>{isPositive ? '+' : '−'}</Text>
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
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : 'Unable to load wallet details.');
      }
    };
    fetchWalletDetails();
  }, [dispatch]);

  const handleWithdraw = () => {
    const activeBalance = balance;
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

  const listData = transactions;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Wallet" onBackPress={() => navigation.goBack()} />

      <View style={styles.body}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>₹{balance.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw} accessibilityRole="button" accessibilityLabel="Withdraw wallet balance">
            <Text style={styles.withdrawLabel}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <FlatList
          data={listData as any}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No wallet transactions yet.</Text>}
        />

        <TouchableOpacity style={styles.viewAllButton} onPress={() => Alert.alert('Transactions', 'There are no additional transaction details available yet.')} accessibilityRole="button" accessibilityLabel="View all wallet transactions">
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
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  errorText: { color: colors.error, textAlign: 'center', marginTop: spacing.sm },
});

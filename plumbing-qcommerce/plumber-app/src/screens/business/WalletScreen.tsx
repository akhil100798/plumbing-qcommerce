import React, { useEffect } from 'react';
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
import { SvgActionCheck, SvgStatusTrendUp } from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'Wallet' | any>;

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'CREDIT' as const,
    amount: 650,
    description: 'Job Payment',
    subtext: '#JKA3215',
    createdAt: 'Today',
  },
  {
    id: '2',
    type: 'CREDIT' as const,
    amount: 150,
    description: 'Incentive',
    subtext: '',
    createdAt: 'Yesterday',
  },
  {
    id: '3',
    type: 'DEBIT' as const,
    amount: 210,
    description: 'Material Advance',
    subtext: '',
    createdAt: 'Yesterday',
  },
  {
    id: '4',
    type: 'DEBIT' as const,
    amount: 2000,
    description: 'Withdrawal',
    subtext: '',
    createdAt: '2 days ago',
  },
];

function TransactionRow({ item }: { item: any }) {
  const isPositive = item.type === 'CREDIT';
  return (
    <View style={styles.txnRow}>
      <View style={styles.txnLeft}>
        <View style={[styles.iconCircle, { backgroundColor: isPositive ? '#ECFDF5' : '#FEF2F2' }]}>
          <SvgActionCheck
            width={16}
            height={16}
            fill={isPositive ? '#059669' : '#EF4444'}
            style={{ transform: [{ rotate: isPositive ? '0deg' : '45deg' }] }}
          />
        </View>
        <View style={styles.txnDetails}>
          <Text style={styles.txnTitle}>{item.description}</Text>
          {item.subtext ? <Text style={styles.txnSub}>{item.subtext}</Text> : null}
        </View>
      </View>
      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color: isPositive ? '#059669' : '#EF4444' }]}>
          {isPositive ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.txnTime}>{item.createdAt}</Text>
      </View>
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
      <AppHeader
        title="Wallet"
        variant="blue"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.body}>
        {/* Stitch Current Balance Card */}
        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>₹{(balance || 3250).toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={handleWithdraw}
            activeOpacity={0.8}
          >
            <Text style={styles.withdrawLabel}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Stitch Transactions Container */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          <FlatList
            data={listData}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <TransactionRow item={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => Alert.alert('All Transactions', 'Full transaction statement exported to your email.')}
          >
            <Text style={styles.viewAllLabel}>View All Transactions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  withdrawButton: {
    backgroundColor: colors.stitchGreen,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    ...shadows.sm,
  },
  withdrawLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnDetails: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  txnSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  txnTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
  },
  viewAllLabel: {
    color: colors.stitchBlue,
    fontSize: 12,
    fontWeight: '600',
  },
});

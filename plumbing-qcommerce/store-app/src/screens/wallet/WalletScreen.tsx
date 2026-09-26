import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import OrderIcon from '../../assets/icons/order.svg';
import WalletIcon from '../../assets/icons/wallet.svg';
import { colors, borderRadius, spacing, typography } from '../../theme';

const transactions = [
  {
    id: '1',
    label: 'Order Payment',
    ref: '#FK123456',
    amount: '+ ₹1,245',
    positive: true,
    time: '11:16 PM',
  },
  {
    id: '2',
    label: 'Payout to Bank',
    ref: 'UTR: SI12345678901',
    amount: '- ₹5,000',
    positive: false,
    time: '10:00 AM',
  },
  {
    id: '3',
    label: 'Order Payment',
    ref: '#FK123455',
    amount: '+ ₹2,860',
    positive: true,
    time: '11:16 PM',
  },
];

export function WalletScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const handleWithdraw = () => {
    Alert.alert('Withdrawal Initiated', 'Payout request of ₹18,560.75 sent to registered bank account.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Balance card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceValue}>₹18,560.75</Text>
            <View style={styles.balanceBottomRow}>
              <Text style={styles.balanceNote}>Available for Payout</Text>
              <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
                <Text style={styles.withdrawButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* This Month */}
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Credits</Text>
              <Text style={styles.statValue}>₹3,48,680</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Debits</Text>
              <Text style={styles.statValue}>₹3,30,119</Text>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.txnHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>
          <View style={styles.card}>
            {transactions.map((txn, idx) => (
              <View
                key={txn.id}
                style={[
                  styles.txnRow,
                  idx !== transactions.length - 1 && styles.txnRowBorder,
                ]}
              >
                <View style={styles.txnIconWrap}>
                  {txn.positive ? (
                    <OrderIcon width={18} height={18} stroke={colors.accentGreen} />
                  ) : (
                    <WalletIcon width={18} height={18} stroke={colors.accentRed} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.txnLabel}>{txn.label}</Text>
                  <Text style={styles.txnRef}>{txn.ref}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txnAmount, { color: txn.positive ? colors.accentGreen : colors.accentRed }]}>
                    {txn.amount}
                  </Text>
                  <Text style={styles.txnTime}>{txn.time}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.viewAllButton} onPress={() => Alert.alert('All Transactions', 'Complete transaction ledger loaded.')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  balanceCard: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.lg || 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: typography.fontSize.xs },
  balanceValue: { color: colors.surface, fontSize: 28, fontWeight: typography.fontWeight.black, marginTop: 6, marginBottom: spacing.lg },
  balanceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceNote: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  withdrawButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: borderRadius.sm,
  },
  withdrawButtonText: { color: colors.accentGreen, fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 },
  statValue: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  txnHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  txnRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  txnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnLabel: { fontSize: 13, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  txnRef: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  txnAmount: { fontSize: 13, fontWeight: typography.fontWeight.bold },
  txnTime: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  viewAllButton: { alignItems: 'center', paddingVertical: spacing.sm },
  viewAllText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
});

export default WalletScreen;

import React, { useState } from 'react';
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
import { StoreIcon } from '../../components/common/StoreIcon';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface Transaction {
  id: string;
  title: string;
  ref: string;
  amount: string;
  positive: boolean;
  date: string;
}

const transactions: Transaction[] = [
  {
    id: '1',
    title: 'Order Payment',
    ref: '#FK123456',
    amount: '+ ₹1,245',
    positive: true,
    date: '21 Mar 2025',
  },
  {
    id: '2',
    title: 'Product Return',
    ref: '#RTN789234',
    amount: '- ₹1,000',
    positive: false,
    date: '19 Mar 2025',
  },
  {
    id: '3',
    title: 'Order Payment',
    ref: '#FK123455',
    amount: '+ ₹2,860',
    positive: true,
    date: '18 Mar 2025',
  },
  {
    id: '4',
    title: 'Bank Settlement',
    ref: '#PAY890123',
    amount: '- ₹15,000',
    positive: false,
    date: '15 Mar 2025',
  },
  {
    id: '5',
    title: 'Order Payment',
    ref: '#FK123450',
    amount: '+ ₹4,310',
    positive: true,
    date: '14 Mar 2025',
  },
];

export function WalletScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState<'thisMonth' | 'lastMonth'>('thisMonth');

  const handleWithdraw = () => {
    Alert.alert(
      'Payout Request',
      'Daily automatic payouts are active. Scheduled settlement of ₹16,560.75 will be processed to HDFC Bank (A/C ending **4821) at 11:59 PM today.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'AccountTab' });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SalesAnalytics')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="chart" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card (Emerald Gradient Theme) */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceValue}>₹16,560.75</Text>
              <Text style={styles.balanceSubtitle}>Available for Bank Payout</Text>
            </View>
            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw} activeOpacity={0.85}>
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Filter Segmented Bar */}
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'thisMonth' && styles.segmentTabActive]}
            onPress={() => setActiveTab('thisMonth')}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === 'thisMonth' && styles.segmentTabTextActive,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'lastMonth' && styles.segmentTabActive]}
            onPress={() => setActiveTab('lastMonth')}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === 'lastMonth' && styles.segmentTabTextActive,
              ]}
            >
              Last Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Credits & Debits Summary */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <StoreIcon name="rupee" size={16} color="#059669" />
            </View>
            <Text style={styles.summaryLabel}>Total Credits</Text>
            <Text style={styles.summaryValue}>
              {activeTab === 'thisMonth' ? '₹3,48,680' : '₹2,94,150'}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconWrap, styles.debitIconWrap]}>
              <StoreIcon name="payout" size={16} color={colors.error} />
            </View>
            <Text style={styles.summaryLabel}>Total Debits</Text>
            <Text style={styles.summaryValue}>
              {activeTab === 'thisMonth' ? '₹2,30,119' : '₹2,80,000'}
            </Text>
          </View>
        </View>

        {/* Staging Bank Info Banner */}
        <View style={styles.bankBanner}>
          <StoreIcon name="store" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bankBannerTitle}>Settlement Bank Account</Text>
            <Text style={styles.bankBannerText}>HDFC Bank · A/C **4821 (IFSC: HDFC0001248)</Text>
          </View>
          <StoreIcon name="verified" size={16} color="#059669" />
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => Alert.alert('All Transactions', 'Full ledger loaded.')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionList}>
            {transactions.map((txn, idx) => (
              <View
                key={txn.id}
                style={[
                  styles.txnRow,
                  idx !== transactions.length - 1 && styles.txnRowBorder,
                ]}
              >
                <View
                  style={[
                    styles.txnIconWrap,
                    txn.positive ? styles.txnIconIncome : styles.txnIconDebit,
                  ]}
                >
                  <StoreIcon
                    name={txn.positive ? 'rupee' : 'payout'}
                    size={18}
                    color={txn.positive ? '#059669' : colors.error}
                  />
                </View>

                <View style={styles.txnMeta}>
                  <Text style={styles.txnTitle}>{txn.title}</Text>
                  <Text style={styles.txnRef}>{txn.ref}</Text>
                </View>

                <View style={styles.txnAmountCol}>
                  <Text
                    style={[
                      styles.txnAmount,
                      { color: txn.positive ? '#059669' : colors.error },
                    ]}
                  >
                    {txn.amount}
                  </Text>
                  <Text style={styles.txnDate}>{txn.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  balanceCard: {
    backgroundColor: '#047857',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: typography.fontWeight.black,
    color: colors.surface,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  balanceSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  withdrawBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segmentTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  debitIconWrap: {
    backgroundColor: '#FEF2F2',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  bankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 10,
  },
  bankBannerTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  bankBannerText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionsSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  transactionList: {},
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  txnRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txnIconWrap: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnIconIncome: {
    backgroundColor: '#ECFDF5',
  },
  txnIconDebit: {
    backgroundColor: '#FEF2F2',
  },
  txnMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  txnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  txnRef: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  txnAmountCol: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
  },
  txnDate: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default WalletScreen;

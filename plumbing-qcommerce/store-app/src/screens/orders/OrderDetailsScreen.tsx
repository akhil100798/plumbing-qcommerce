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
import ProfileIcon from '../../assets/icons/profile.svg';
import PhoneIcon from '../../assets/icons/phone.svg';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';

const items = [
  { name: 'CPVC Pipe 1/2 inch (3m)', qty: 'x2', price: '₹180' },
  { name: 'Brass Angle Valve 1/2 inch', qty: 'x1', price: '₹420' },
  { name: 'PTFE Thread Tape (10m)', qty: 'x1', price: '₹45' },
  { name: 'PVC Elbow 1/2 inch', qty: 'x2', price: '₹120' },
  { name: 'PVC Tee 1/2 inch', qty: 'x1', price: '₹180' },
];

export function OrderDetailsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity onPress={() => Alert.alert('Share Order', 'Order summary link copied to clipboard.')}>
          <Text style={{ fontSize: 18 }}>🔗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status */}
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Processing</Text>
          </View>
          <Text style={styles.orderId}>#FK123456</Text>
          <Text style={styles.orderDate}>Placed on 21 May 2025, 10:30 AM</Text>

          {/* Customer card */}
          <View style={styles.card}>
            <View style={styles.customerRow}>
              <View style={styles.avatar}>
                <ProfileIcon width={18} height={18} stroke={colors.textMuted} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.customerName}>Rahul Sharma</Text>
                <Text style={styles.customerPhone}>98765 43210</Text>
                <Text style={styles.customerAddress}>Kandivali West, Mumbai</Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={() => Alert.alert('Calling', 'Calling customer Rahul Sharma (98765 43210)')}>
                <PhoneIcon width={18} height={18} stroke={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Order items */}
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          <View style={styles.card}>
            {items.map((item, idx) => (
              <View
                key={item.name}
                style={[
                  styles.itemRow,
                  idx !== items.length - 1 && styles.itemRowBorder,
                ]}
              >
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.qty}</Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
            ))}
          </View>

          {/* Bill summary */}
          <View style={styles.card}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹1,025</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Charge</Text>
              <Text style={styles.billValue}>₹40</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Fee</Text>
              <Text style={styles.billValue}>₹20</Text>
            </View>
            <View style={[styles.billRow, { marginTop: 6 }]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹1,245</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageButton} onPress={() => Alert.alert('Customer Chat', 'Opened live chat with Rahul Sharma.')}>
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.packingButton} onPress={() => navigation.navigate('Packing' as any)}>
          <Text style={styles.packingButtonText}>Start Packing</Text>
        </TouchableOpacity>
      </View>
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
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E9AE0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
    marginBottom: spacing.md,
  },
  statusPillText: { color: colors.surface, fontSize: 11, fontWeight: '700' },
  orderId: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  orderDate: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  customerPhone: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  customerAddress: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 1 },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { flex: 1, fontSize: 13, color: colors.textPrimary },
  itemQty: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginHorizontal: spacing.md },
  itemPrice: { fontSize: 13, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, width: 50, textAlign: 'right' },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: { fontSize: 13, color: colors.textSecondary },
  billValue: { fontSize: 13, color: colors.textPrimary },
  totalLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  totalValue: { fontSize: 16, fontWeight: typography.fontWeight.bold, color: colors.success },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  messageButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  messageButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  packingButton: {
    flex: 1.4,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packingButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.surface },
});

export default OrderDetailsScreen;

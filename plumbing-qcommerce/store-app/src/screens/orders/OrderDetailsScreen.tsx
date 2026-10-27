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
import { NavigationProp, useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import StoreIcon from '../../components/common/StoreIcon';
import { PrimaryButton } from '../../components/common/PrimaryButton';

const items = [
  { name: 'CPVC Pipe 1/2 inch (3m)', qty: 'x2', price: '₹180', stock: 'In Stock' },
  { name: 'Brass Angle Valve 1/2 inch', qty: 'x1', price: '₹420', stock: 'In Stock' },
  { name: 'PTFE Thread Tape (10m)', qty: 'x1', price: '₹45', stock: 'In Stock' },
  { name: 'PVC Elbow 1/2 inch', qty: 'x2', price: '₹120', stock: 'In Stock' },
  { name: 'PVC Tee 1/2 inch', qty: 'x1', price: '₹180', stock: 'In Stock' },
];

export function OrderDetailsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'OrderDetails'>>();
  const orderId = (route.params as any)?.orderId || '#FK123456';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go Back"
        >
          <StoreIcon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Share Order', 'Order summary link copied to clipboard.')}
          accessibilityLabel="Share Order Summary"
        >
          <StoreIcon name="share" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Order Badge & Info */}
        <View style={styles.topInfoCard}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>READY FOR PACKING</Text>
          </View>
          <Text style={styles.orderIdText}>{orderId}</Text>
          <Text style={styles.orderDateText}>Placed on Today, 10:30 AM · Service Linked</Text>

          {/* Fulfillment Mode Badge */}
          <View style={styles.fulfillmentPill}>
            <StoreIcon name="store" size={14} color={colors.primary} />
            <Text style={styles.fulfillmentText}>Plumber Counter Self-Pickup</Text>
          </View>
        </View>

        {/* 4-Step Operational Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Fulfillment Progress</Text>
          <View style={styles.timelineRow}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]}>
                <StoreIcon name="check" size={10} color="#FFFFFF" />
              </View>
              <Text style={styles.timelineLabelActive}>Confirmed</Text>
            </View>
            <View style={[styles.timelineLine, styles.timelineLineActive]} />
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotCurrent]}>
                <View style={styles.timelineInnerDot} />
              </View>
              <Text style={styles.timelineLabelActive}>Packing</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineStep}>
              <View style={styles.timelineDot}>
                <View style={[styles.timelineInnerDot, { backgroundColor: '#CBD5E1' }]} />
              </View>
              <Text style={styles.timelineLabel}>Ready</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineStep}>
              <View style={styles.timelineDot}>
                <View style={[styles.timelineInnerDot, { backgroundColor: '#CBD5E1' }]} />
              </View>
              <Text style={styles.timelineLabel}>Collected</Text>
            </View>
          </View>
        </View>

        {/* Linked Assigned Plumber & Customer Info */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Assigned Plumber</Text>
          <View style={styles.personRow}>
            <View style={styles.avatarBox}>
              <StoreIcon name="wrench" size={18} color={colors.primary} />
            </View>
            <View style={styles.personInfoCol}>
              <Text style={styles.personName}>Ravi Kumar (Verified Partner)</Text>
              <Text style={styles.personSub}>Pickup Window: In 15 mins</Text>
            </View>
            <TouchableOpacity
              style={styles.callIconBtn}
              onPress={() => Alert.alert('Contacting Plumber', 'Connecting call to plumber Ravi Kumar (+91 98765 43210)...')}
            >
              <StoreIcon name="phone" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          <Text style={styles.cardSectionLabel}>Customer Details</Text>
          <View style={styles.personRow}>
            <View style={[styles.avatarBox, { backgroundColor: '#F1F5F9' }]}>
              <StoreIcon name="profile" size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.personInfoCol}>
              <Text style={styles.personName}>Rahul Sharma</Text>
              <Text style={styles.personSub}>Kandivali West, Mumbai</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.itemHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Requested Materials ({items.length})</Text>
            <Text style={styles.allInStockText}>All In Stock</Text>
          </View>

          {items.map((item, idx) => (
            <View
              key={item.name}
              style={[
                styles.itemRow,
                idx !== items.length - 1 && styles.itemRowBorder,
              ]}
            >
              <View style={styles.itemThumb}>
                <StoreIcon name="plumbing-fitting" size={20} color={colors.primary} />
              </View>
              <View style={styles.itemDetailsCol}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemStockTag}>{item.stock}</Text>
              </View>
              <View style={styles.itemQtyPriceCol}>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <Text style={styles.itemQty}>{item.qty}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Material Bill Breakdown</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Materials Subtotal</Text>
            <Text style={styles.billValue}>₹945.00</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST (18%)</Text>
            <Text style={styles.billValue}>₹170.10</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Plumber Counter Self-Pickup</Text>
            <Text style={[styles.billValue, { color: '#16A34A', fontWeight: 'bold' }]}>FREE</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Store Payout Amount</Text>
            <Text style={styles.totalValue}>₹1,115.10</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => Alert.alert('Customer Chat', 'Opened direct messaging for order ' + orderId)}
        >
          <StoreIcon name="chat" size={18} color={colors.primary} />
          <Text style={styles.secondaryActionText}>Message</Text>
        </TouchableOpacity>

        <PrimaryButton
          title="Start Packing Checklist"
          onPress={() => navigation.navigate('Packing' as any, { orderId })}
          style={styles.primaryActionBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECEF',
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  topInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    marginBottom: spacing.sm,
  },
  statusPillText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderIdText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  orderDateText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  fulfillmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  fulfillmentText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  timelineTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineStep: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 4,
  },
  timelineDotActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  timelineDotCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
  },
  timelineInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  timelineLineActive: {
    backgroundColor: '#16A34A',
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
  },
  timelineLabelActive: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  cardHeaderTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  allInStockText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#16A34A',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  personInfoCol: {
    flex: 1,
  },
  personName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  personSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemDetailsCol: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemStockTag: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  itemQtyPriceCol: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  itemQty: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  billLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#EAECEF',
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAECEF',
    ...shadows.sm,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  secondaryActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.sm,
  },
});

export default OrderDetailsScreen;

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { StoreIcon } from '../../components/common/StoreIcon';

interface Promotion {
  id: string;
  code: string;
  title: string;
  discount: string;
  minOrder: string;
  validTill: string;
  status: 'active' | 'upcoming' | 'expired';
}

const initialPromotions: Promotion[] = [
  {
    id: '1',
    code: 'PLUMB20',
    title: 'Special Plumber Discount on CPVC Fittings',
    discount: '20% OFF',
    minOrder: 'Min. Order ₹500',
    validTill: 'Valid till 31 Mar 2025',
    status: 'active',
  },
  {
    id: '2',
    code: 'VALVE10',
    title: 'Brass Ball & Angle Valves Counter Deal',
    discount: '10% OFF',
    minOrder: 'Min. Order ₹1,000',
    validTill: 'Valid till 15 Apr 2025',
    status: 'active',
  },
  {
    id: '3',
    code: 'BULK50',
    title: 'Bulk Store Counter Pickup Savings',
    discount: '₹50 FLAT OFF',
    minOrder: 'Min. Order ₹2,500',
    validTill: 'Valid till 30 Apr 2025',
    status: 'active',
  },
  {
    id: '4',
    code: 'MONSOON25',
    title: 'Monsoon Waterproofing & Sealants Offer',
    discount: '25% OFF',
    minOrder: 'Min. Order ₹750',
    validTill: 'Starts 1 Jun 2025',
    status: 'upcoming',
  },
  {
    id: '5',
    code: 'NEWYEAR15',
    title: 'New Year Store Clearance Coupon',
    discount: '15% OFF',
    minOrder: 'Min. Order ₹500',
    validTill: 'Expired 31 Jan 2025',
    status: 'expired',
  },
];

export const OffersPromotionsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'expired'>('active');
  const [modalVisible, setModalVisible] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newMinOrder, setNewMinOrder] = useState('');

  const activeCount = promotions.filter((p) => p.status === 'active').length;
  const upcomingCount = promotions.filter((p) => p.status === 'upcoming').length;
  const expiredCount = promotions.filter((p) => p.status === 'expired').length;

  const filteredPromotions = promotions.filter((p) => p.status === activeTab);

  const handleCreateCoupon = () => {
    if (!newCode.trim()) {
      Alert.alert('Validation Error', 'Please enter a coupon code.');
      return;
    }
    if (!newDiscount.trim()) {
      Alert.alert('Validation Error', 'Please enter a discount value.');
      return;
    }

    const created: Promotion = {
      id: Date.now().toString(),
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim() || 'Store Counter Promotion',
      discount: newDiscount.trim(),
      minOrder: newMinOrder.trim() ? `Min. Order ₹${newMinOrder.trim()}` : 'No Min. Order',
      validTill: 'Valid till 30 Apr 2025',
      status: 'active',
    };

    setPromotions((prev) => [created, ...prev]);
    setModalVisible(false);
    setNewCode('');
    setNewTitle('');
    setNewDiscount('');
    setNewMinOrder('');
    Alert.alert('Coupon Created', `Promotion code ${created.code} is now active.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header */}
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
        <Text style={styles.headerTitle}>Offers & Promotions</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'active' && styles.tabItemActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabLabel, activeTab === 'active' && styles.tabLabelActive]}>
            Active ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'upcoming' && styles.tabItemActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabLabel, activeTab === 'upcoming' && styles.tabLabelActive]}>
            Upcoming ({upcomingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'expired' && styles.tabItemActive]}
          onPress={() => setActiveTab('expired')}
        >
          <Text style={[styles.tabLabel, activeTab === 'expired' && styles.tabLabelActive]}>
            Expired ({expiredCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Promotions List */}
      <FlatList
        data={filteredPromotions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.couponCard}>
            <View style={styles.couponLeft}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{item.discount}</Text>
              </View>
              <Text style={styles.couponTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.couponMeta}>
                {item.minOrder} · {item.validTill}
              </Text>
            </View>

            <View style={styles.couponDashedDivider} />

            <View style={styles.couponRight}>
              <View style={styles.codePill}>
                <Text style={styles.codePillText}>{item.code}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'active'
                    ? styles.statusActive
                    : item.status === 'upcoming'
                    ? styles.statusUpcoming
                    : styles.statusExpired,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.status === 'active'
                      ? styles.statusTextActive
                      : item.status === 'upcoming'
                      ? styles.statusTextUpcoming
                      : styles.statusTextExpired,
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <StoreIcon name="promotion" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Promotions</Text>
            <Text style={styles.emptySubtitle}>
              No {activeTab} coupons found for your store counter.
            </Text>
          </View>
        }
      />

      {/* Sticky Bottom "+ Create Offer" Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.createOfferBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <StoreIcon name="plus" size={18} color={colors.surface} />
          <Text style={styles.createOfferBtnText}>Create New Offer</Text>
        </TouchableOpacity>
      </View>

      {/* Create Offer Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Promotion</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <StoreIcon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Coupon Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. FIXKART20"
              placeholderTextColor={colors.textMuted}
              value={newCode}
              onChangeText={setNewCode}
              autoCapitalize="characters"
            />

            <Text style={styles.fieldLabel}>Promotion Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 20% off on all PVC Pipes"
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <View style={styles.rowTwo}>
              <View style={styles.halfCol}>
                <Text style={styles.fieldLabel}>Discount *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 20% OFF or ₹50 FLAT"
                  placeholderTextColor={colors.textMuted}
                  value={newDiscount}
                  onChangeText={setNewDiscount}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.fieldLabel}>Min Order (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={newMinOrder}
                  onChangeText={setNewMinOrder}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateCoupon}>
              <Text style={styles.modalSubmitText}>Publish Coupon</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 96,
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  couponLeft: {
    flex: 1,
    padding: spacing.md,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  couponMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  couponDashedDivider: {
    width: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  couponRight: {
    width: 110,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: 8,
  },
  codePill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusUpcoming: {
    backgroundColor: '#FEF3C7',
  },
  statusExpired: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextUpcoming: {
    color: '#D97706',
  },
  statusTextExpired: {
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createOfferBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  createOfferBtnText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  modalSubmitBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
});

export default OffersPromotionsScreen;

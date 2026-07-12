import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, Alert, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { OfferCard } from '../../components/cards/WalletReviewsPromoCards';
import { OfferForm } from '../../components/forms/ProductOfferStockForms';
import { mockOffers } from '../../mocks';
import { canUseDevMockFallbacks } from '../../services/mockPolicy';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Offer } from '../../types';

export const OffersPromotionsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const devMode = canUseDevMockFallbacks();

  const loadOffers = async () => {
    setLoading(true);
    try {
      setOffers(devMode ? mockOffers : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffers(); }, [devMode]);

  const handleToggle = (offerId: number, val: boolean) => {
    if (!devMode) {
      Alert.alert('Feature unavailable', 'Offer activation is not available in staging.');
      return;
    }
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, active: val } : o));
  };

  const handleCreateOffer = (values: Partial<Offer>) => {
    if (!devMode) {
      Alert.alert('Feature unavailable', 'Offer creation is not available in staging.');
      return;
    }
    const newOffer: Offer = { id: Date.now(), code: values.code || 'COUPON', description: values.description || '', type: values.type || 'FLAT', value: values.value || 0, minOrderAmount: values.minOrderAmount || 0, active: true, expiryDate: values.expiryDate || new Date().toISOString() };
    setOffers(prev => [...prev, newOffer]);
    setShowModal(false);
    Alert.alert('Coupon Created', `Offer code ${newOffer.code} is now active.`);
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader
        title="Offers & Promotions"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={() => devMode ? setShowModal(true) : Alert.alert('Feature unavailable', 'Offer creation is not available in staging.')}>
            <Text style={styles.addBtnText}>{devMode ? '? New' : 'Unavailable'}</Text>
          </TouchableOpacity>
        }
      />

      {!devMode && <Text style={styles.noticeText}>Promotions remain disabled in staging until the live offers API is available.</Text>}

      <FlatList
        data={offers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadOffers}
        renderItem={({ item }) => <OfferCard offer={item} onToggleActive={(val) => handleToggle(item.id, val)} />}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyEmoji}>??</Text><Text style={styles.emptyText}>{devMode ? 'No demo promotions currently active' : 'Offers are not available in staging.'}</Text></View>}
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Offer</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}><Text style={styles.closeEmoji}>?</Text></TouchableOpacity>
            </View>
            <OfferForm onSubmit={handleCreateOffer} />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.xs },
  addBtnText: { color: colors.card, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  noticeText: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginHorizontal: spacing.layout, marginTop: spacing.md },
  list: { padding: spacing.layout },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.giant },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.bold, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.layout, paddingBottom: spacing.giant, ...shadows.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  modalTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  closeBtn: { padding: spacing.xs },
  closeEmoji: { fontSize: 12, color: colors.textMuted },
});
export default OffersPromotionsScreen;

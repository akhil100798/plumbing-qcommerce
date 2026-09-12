import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAuth, Address } from '../../services/authService';
import {
  ChevronLeftIcon,
  CheckCircleIcon,
  TrashIcon,
} from '../../assets/svg/Icons';

interface SavedAddressesScreenProps {
  onBack: () => void;
}

export const SavedAddressesScreen: React.FC<SavedAddressesScreenProps> = ({ onBack }) => {
  const { addresses, selectedAddress, selectAddress, addAddress, deleteAddress, refreshAddresses, user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(user?.name || 'Customer');
  const [phone, setPhone] = useState(user?.phone || '9876511223');
  const [flat, setFlat] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560102');
  const [type, setType] = useState<'home' | 'work' | 'other'>('home');

  useEffect(() => {
    refreshAddresses();
  }, [refreshAddresses]);

  const handleSave = async () => {
    if (flat && area) {
      setIsSaving(true);
      try {
        await addAddress({
          name: name || user?.name || 'Customer',
          phone: phone || user?.phone || '9876511223',
          flat,
          area,
          landmark: '',
          city: city || 'Bengaluru',
          pincode: pincode || '560102',
          type,
          isDefault: addresses.length === 0,
        });
        setShowAddModal(false);
        setFlat('');
        setArea('');
      } catch (e) {
        console.error('Failed to save address:', e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id);
    } catch (e) {
      console.error('Failed to delete address:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back button">
          <ChevronLeftIcon size={22} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Address CTA */}
        <TouchableOpacity
          style={styles.addNewBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add New Service Address"
        >
          <Text style={styles.addNewIcon}>+</Text>
          <Text style={styles.addNewText}>Add New Service Address</Text>
        </TouchableOpacity>

        {/* Address Cards */}
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptySubtitle}>Add your home or office address to book plumbing services.</Text>
          </View>
        ) : (
          addresses.map((addr) => {
            const isSelected = selectedAddress.id === addr.id;
            return (
              <TouchableOpacity
                key={addr.id}
                style={[styles.addressCard, isSelected && styles.selectedAddressCard]}
                onPress={() => selectAddress(addr.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View style={styles.cardHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{addr.type.toUpperCase()}</Text>
                  </View>
                  <View style={styles.headerActions}>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <CheckCircleIcon size={16} color={colors.primary} />
                        <Text style={styles.selectedBadgeText}>SELECTED</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDelete(addr.id)}
                      style={styles.deleteBtn}
                      accessibilityLabel="Delete address"
                    >
                      <TrashIcon size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.nameText}>{addr.name}</Text>
                <Text style={styles.detailsText}>
                  {addr.addressLine || `${addr.flat}, ${addr.area}, ${addr.city} - ${addr.pincode}`}
                </Text>
                <Text style={styles.phoneText}>Mobile: {addr.phone}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>

            <View style={styles.typeSelectRow}>
              {(['home', 'work', 'other'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeOption, type === t && styles.typeOptionActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              value={flat}
              onChangeText={setFlat}
              placeholder="Flat / House No / Building Name (e.g. Flat 402, Sunshine Res)"
              placeholderTextColor={colors.outline}
            />

            <TextInput
              style={styles.modalInput}
              value={area}
              onChangeText={setArea}
              placeholder="Area / Street / Sector (e.g. Sector 14, HSR Layout)"
              placeholderTextColor={colors.outline}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={colors.outline}
              />
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                value={pincode}
                onChangeText={setPincode}
                placeholder="Pincode"
                placeholderTextColor={colors.outline}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, (!flat || !area || isSaving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!flat || !area || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  addNewIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  addNewText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  selectedAddressCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  nameText: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: 2,
  },
  detailsText: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  phoneText: {
    fontSize: 11,
    color: colors.outline,
    marginTop: 4,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
  },
  modalTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.md,
  },
  typeSelectRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  typeOptionTextActive: {
    color: '#ffffff',
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: spacing.sm,
  },
  cancelBtnText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.outlineVariant,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

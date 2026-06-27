import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';

import { AddressCard } from '../components/cards/AddressCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { addAddress, deleteAddress, setSelectedAddress, setAddresses } from '../redux/slices/addressSlice';
import { AddressRepository } from '../services/address/addressRepository';
import { RootState } from '../redux/store';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'AddressManagement'>;

export function AddressManagementScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { addresses, selectedId } = useSelector((state: RootState) => state.address);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const list = await AddressRepository.getAddresses();
        dispatch(setAddresses(list.map((addr) => ({
          id: addr.id,
          label: addr.label,
          name: addr.name,
          addressLine: addr.addressLine,
          phone: addr.phone,
        }))));
      } catch (err) {
        console.error('Failed to fetch addresses', err);
      }
    };
    fetchAddresses();
  }, [dispatch]);

  const handleAddNew = async () => {
    try {
      const saved = await AddressRepository.addAddress({
        label: 'Other',
        name: 'Akhil Kumar (Secondary)',
        addressLine: 'Plot No. 12, Kavuri Hills, Phase 2, Near Jubilee Hills, Hyderabad, 500033',
        phone: '+91 98765 43210',
      });
      dispatch(
        addAddress({
          id: saved.id,
          label: saved.label,
          name: saved.name,
          addressLine: saved.addressLine,
          phone: saved.phone,
        })
      );
    } catch (err) {
      console.error('Failed to add address', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await AddressRepository.deleteAddress(id);
      dispatch(deleteAddress(id));
    } catch (err) {
      console.error('Failed to delete address', err);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Addresses</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Default Delivery Address</Text>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved addresses found.</Text>
          </View>
        ) : (
          addresses.map((item) => (
            <View key={item.id} style={styles.cardWrapper}>
              <AddressCard
                id={item.id}
                label={item.label}
                name={item.name}
                addressLine={item.addressLine}
                phone={item.phone}
                selected={selectedId === item.id}
                onSelect={() => dispatch(setSelectedAddress(item.id))}
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="+ Add New Address"
          onPress={handleAddNew}
          style={styles.addBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  deleteBtn: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  addBtn: {
    width: '100%',
  },
});

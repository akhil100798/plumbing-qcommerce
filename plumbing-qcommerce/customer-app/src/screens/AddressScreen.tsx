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
import { addAddress, setSelectedAddress, setAddresses } from '../redux/slices/addressSlice';
import { AddressRepository } from '../services/address/addressRepository';
import { RootState } from '../redux/store';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Address'>;

export function AddressScreen({ navigation, route }: Props) {
  const dispatch = useDispatch();
  const { addresses, selectedId } = useSelector((state: RootState) => state.address);
  const totalAmount = route.params?.totalAmount || 0;

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
        name: 'Akhil',
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


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Address</Text>
      </View>

      {/* Stepper progress indicator */}
      <View style={styles.stepperContainer}>
        <View style={styles.step}>
          <View style={[styles.stepDot, styles.stepDotActive]}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={styles.stepLabelActive}>Address</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.step}>
          <View style={styles.stepDot}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Payment</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.step}>
          <View style={styles.stepDot}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={styles.stepLabel}>Confirm</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>DELIVERY ADDRESS</Text>
        {addresses
          .filter((a) => a.id === selectedId)
          .map((a) => (
            <AddressCard
              key={a.id}
              id={a.id}
              label={a.label}
              name={a.name}
              addressLine={a.addressLine}
              phone={a.phone}
              selected={true}
              onSelect={() => {}}
            />
          ))}

        <Text style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          OTHER SAVED ADDRESSES
        </Text>
        {addresses
          .filter((a) => a.id !== selectedId)
          .map((a) => (
             <AddressCard
               key={a.id}
               id={a.id}
               label={a.label}
               name={a.name}
               addressLine={a.addressLine}
               phone={a.phone}
               selected={false}
               onSelect={() => dispatch(setSelectedAddress(a.id))}
             />
          ))}

        <TouchableOpacity style={styles.addNewBtn} onPress={handleAddNew}>
          <Text style={styles.addNewBtnText}>+ Add New Address</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Proceed to Payment"
          onPress={() => navigation.navigate('Payment', { totalAmount })}
          style={styles.proceedBtn}
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
  stepperContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  step: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
  },
  stepLabelActive: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
    marginBottom: 14,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  addNewBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  addNewBtnText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  proceedBtn: {
    width: '100%',
  },
});

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '../common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import { UserAddressDTO } from '../../services/address/addressRepository';

type AddressInput = Omit<UserAddressDTO, 'id'>;

interface Props {
  onSave: (address: AddressInput) => Promise<void>;
  onCancel: () => void;
}

export function AddressForm({ onSave, onCancel }: Props) {
  const [form, setForm] = useState<AddressInput>({ label: 'Home', name: '', addressLine: '', phone: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key: keyof AddressInput) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrorMessage('');
  };

  const save = async () => {
    const name = form.name.trim();
    const addressLine = form.addressLine.trim();
    const phone = form.phone.replace(/\D/g, '');
    if (!name || !addressLine || !phone) {
      setErrorMessage('Name, address and mobile number are required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErrorMessage('Enter a valid 10-digit mobile number.');
      return;
    }

    setSaving(true);
    try {
      await onSave({ label: form.label.trim() || 'Other', name, addressLine, phone });
    } catch (error: any) {
      setErrorMessage(error?.message || 'We could not save this address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a new address</Text>
      <TextInput accessibilityLabel="Address label" style={styles.input} placeholder="Label (Home, Work)" value={form.label} onChangeText={update('label')} />
      <TextInput accessibilityLabel="Recipient name" style={styles.input} placeholder="Recipient name" value={form.name} onChangeText={update('name')} />
      <TextInput accessibilityLabel="Address" style={[styles.input, styles.multiline]} placeholder="Full address" value={form.addressLine} onChangeText={update('addressLine')} multiline />
      <TextInput accessibilityLabel="Mobile number" style={styles.input} placeholder="10-digit mobile number" value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad" maxLength={10} />
      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" style={styles.cancelButton} onPress={onCancel} disabled={saving}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <PrimaryButton title="Save Address" onPress={save} loading={saving} style={styles.saveButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, marginBottom: spacing.sm },
  input: { height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, color: colors.textPrimary, marginBottom: spacing.sm, backgroundColor: colors.background },
  multiline: { height: 72, paddingTop: spacing.sm, textAlignVertical: 'top' },
  error: { color: colors.error, fontSize: typography.fontSize.xs, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cancelButton: { height: 48, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.borderDark, borderRadius: 8, justifyContent: 'center' },
  cancelText: { color: colors.textSecondary, fontWeight: typography.fontWeight.bold },
  saveButton: { flex: 1 },
});

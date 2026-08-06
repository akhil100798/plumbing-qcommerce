import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { authSuccess } from '../../redux/slices/authSlice';
import { authService } from '../../services/auth/authService';
import { colors, spacing } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', storeName: '', storeAddress: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const register = async () => {
    if (Object.values(form).some((value) => !value.trim())) {
      Alert.alert('Validation Error', 'Complete every field.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || !/^[6-9]\d{9}$/.test(form.phone)) {
      Alert.alert('Validation Error', 'Enter a valid email and 10-digit Indian mobile number.');
      return;
    }
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      Alert.alert('Validation Error', 'Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    if (form.password.length < 8 || form.password !== form.confirmPassword) {
      Alert.alert('Validation Error', form.password.length < 8 ? 'Password must be at least 8 characters.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        storeName: form.storeName.trim(),
        storeAddress: form.storeAddress.trim(),
        latitude,
        longitude,
      });
      dispatch(authSuccess(result));
      navigation.replace('Main' as any);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Register your Store</Text>
          <Text style={styles.subtitle}>Create a Store manager account and business profile.</Text>
          <View style={styles.card}>
            <Field label="Manager full name" value={form.fullName} onChangeText={set('fullName')} />
            <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
            <Field label="Mobile number" value={form.phone} onChangeText={(v: string) => set('phone')(v.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" />
            <Field label="Store name" value={form.storeName} onChangeText={set('storeName')} />
            <Field label="Store address" value={form.storeAddress} onChangeText={set('storeAddress')} />
            <View style={styles.row}>
              <View style={styles.half}><Field label="Latitude" value={form.latitude} onChangeText={set('latitude')} keyboardType="numbers-and-punctuation" /></View>
              <View style={styles.half}><Field label="Longitude" value={form.longitude} onChangeText={set('longitude')} keyboardType="numbers-and-punctuation" /></View>
            </View>
            <Field label="Password" value={form.password} onChangeText={set('password')} secureTextEntry />
            <Field label="Confirm password" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry />
            <PrimaryButton title="Create Store Account" onPress={register} loading={loading} style={styles.button} />
            <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.link}>Already registered? Log in</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function Field(props: any) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} label={undefined} style={styles.input} autoCapitalize="none" placeholderTextColor={colors.textMuted} /></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { flexGrow: 1, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary }, subtitle: { marginTop: 8, marginBottom: 20, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg }, field: { marginBottom: 12 },
  label: { color: colors.textPrimary, fontWeight: '600', marginBottom: 6 }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, height: 48, color: colors.textPrimary },
  row: { flexDirection: 'row', gap: 10 }, half: { flex: 1 }, button: { marginTop: 8 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 18, fontWeight: '600' },
});

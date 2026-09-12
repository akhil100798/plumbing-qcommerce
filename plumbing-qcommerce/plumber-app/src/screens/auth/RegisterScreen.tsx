import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { authFailure, authStart, authSuccess } from '../../redux/slices/authSlice';
import { authService } from '../../services/auth/authService';
import { colors, spacing } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Complete every field.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Validation Error', 'Enter a valid email address.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Validation Error', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (password.length < 8 || password !== confirmPassword) {
      Alert.alert('Validation Error', password.length < 8 ? 'Password must be at least 8 characters.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    dispatch(authStart());
    try {
      const result = await authService.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone,
        password,
        confirmPassword,
      });
      dispatch(authSuccess(result));
      navigation.replace('Main' as any);
    } catch (error: any) {
      dispatch(authFailure(error.message || 'Registration failed'));
      Alert.alert('Registration Failed', error.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Become a FixKart Plumber</Text>
          <Text style={styles.subtitle}>Create your account. KYC can be completed after registration.</Text>
          <View style={styles.card}>
            <Field label="Full name" value={fullName} onChangeText={setFullName} />
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field label="Mobile number" value={phone} onChangeText={(v: string) => setPhone(v.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <PrimaryButton title="Create Plumber Account" onPress={register} loading={loading} style={styles.button} />
            <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.link}>Already registered? Log in</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function Field(props: any) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} label={undefined} accessibilityLabel={props.label} style={styles.input} autoCapitalize="none" placeholderTextColor={colors.textMuted} /></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary }, subtitle: { marginTop: 8, marginBottom: 20, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg }, field: { marginBottom: 14 },
  label: { color: colors.textPrimary, fontWeight: '600', marginBottom: 6 }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, height: 48, color: colors.textPrimary },
  button: { marginTop: 8 }, link: { color: colors.primary, textAlign: 'center', marginTop: 18, fontWeight: '600' },
});

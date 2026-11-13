import React, { useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { OTPInput } from '../../components/forms/OTPInput';
import { authService } from '../../services/auth/authService';
import { AuthStackParamList } from '../../types/navigation';
import { authSuccess, authFailure } from '../../redux/slices/authSlice';
import { SvgStatusVerifiedBadge, SvgMatMaterialApproval } from '../../assets/svg';

type Props = StackScreenProps<AuthStackParamList, 'Otp'>;

export function OtpScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const phone = route.params?.phone || '+91 98765 43210';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(28);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(phone, code);
      dispatch(authSuccess(response));
      setLoading(false);
      navigation.replace('Main' as any);
    } catch (err: any) {
      setLoading(false);
      dispatch(authFailure(err.message || 'OTP verification failed'));
      Alert.alert('Verification Failed', err.message || 'The OTP entered is incorrect. Try 123456.');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await authService.sendOtp(phone);
      setTimer(30);
      Alert.alert('OTP Resent', 'A new verification code has been sent to your phone.');
    } catch (err: any) {
      Alert.alert('Resend Failed', err.message || 'Could not resend OTP.');
    }
  };

  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: '#FFFFFF' }}>
      <AppHeader title="Verify Number" onBackPress={() => navigation.goBack()} />

      <View style={styles.container}>
        {/* Verification Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>
        </View>

        {/* 6-digit OTP Inputs */}
        <View style={styles.otpWrapper}>
          <OTPInput length={6} onCodeChanged={setCode} />
        </View>

        {/* Resend Timer */}
        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend OTP in <Text style={styles.timerHighlight}>{mm}:{ss}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Radiating Concentric Security Shield Illustration */}
        <View style={styles.shieldSection}>
          <View style={styles.outerRing} />
          <View style={styles.middleRing} />
          <View style={styles.diamondBox} />
          <View style={styles.shieldCard}>
            <SvgStatusVerifiedBadge width={48} height={48} fill="#2563EB" />
          </View>
        </View>

        {/* Action Button & Trust Badge */}
        <View style={styles.bottomSection}>
          <PrimaryButton
            title="Verify & Continue"
            onPress={handleVerify}
            loading={loading}
            style={styles.verifyBtn}
          />

          <View style={styles.trustBadge}>
            <SvgMatMaterialApproval width={14} height={14} stroke="#94A3B8" fill="none" />
            <Text style={styles.trustText}>Your data is safe with us</Text>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: '#0F172A',
  },
  otpWrapper: {
    marginVertical: 18,
    alignItems: 'center',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 12,
    color: '#64748B',
  },
  timerHighlight: {
    color: '#0755E9',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 13,
    color: '#0755E9',
    fontWeight: '600',
  },
  shieldSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 180,
  },
  outerRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EFF6FF',
    opacity: 0.6,
  },
  middleRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#DBEAFE',
    opacity: 0.5,
  },
  diamondBox: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  shieldCard: {
    width: 90,
    height: 104,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  bottomSection: {
    gap: 16,
    alignItems: 'center',
  },
  verifyBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

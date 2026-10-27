import { CommonActions } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { StitchButton } from '../../components/common/StitchButton';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { loginSuccess } from '../../redux/slices/authSlice';
import { AuthRepository } from '../../services/auth/authRepository';
import { SvgServicesLock } from '../../assets/svg';

type Props = StackScreenProps<AuthStackParamList, 'Otp'>;

export function OtpScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(25);
  const inputRef = useRef<TextInput>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (code.length < 6) return;

    setLoading(true);
    try {
      const loginResponse = await AuthRepository.verifyOtp(phone, code);
      dispatch(
        loginSuccess({
          user: {
            id: loginResponse.userId,
            email: loginResponse.email,
            fullName: 'Customer',
            role: loginResponse.role,
            phone: phone,
          },
          token: loginResponse.token,
          refreshToken: loginResponse.refreshToken,
        })
      );

      const parent = navigation.getParent();
      if (parent) {
        try {
          parent.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        } catch (_) {}
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.length === 6) {
      Keyboard.dismiss();
      handleVerify();
    }
  }, [code]);

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const char = code[i] || '';
      const isFocused = code.length === i;
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            char ? styles.otpBoxFilled : null,
            isFocused ? styles.otpBoxFocused : null,
          ]}
        >
          <Text style={styles.otpText}>{char}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify OTP</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.lockIconBox}>
            <SvgServicesLock width={24} height={24} stroke={colors.primary} />
          </View>

          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We have sent a 6-digit code to your registered mobile number
          </Text>

          <View style={styles.phoneRow}>
            <Text style={styles.phoneText}>+91 {phone}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* OTP Digit Boxes */}
          <Pressable style={styles.otpContainer} onPress={handleBoxPress}>
            {renderOtpBoxes()}
          </Pressable>

          {/* Hidden Real Input */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
            autoFocus
          />

          <Text style={styles.countdownText}>
            Auto detecting OTP...{' '}
            <Text style={styles.countdownSec}>0:{countdown < 10 ? `0${countdown}` : countdown}</Text>
          </Text>

          <StitchButton
            title="Verify & Continue"
            onPress={handleVerify}
            loading={loading}
            disabled={code.length < 6}
            variant="primary"
            style={styles.verifyButton}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendPrompt}>Didn't receive the code? </Text>
            <TouchableOpacity disabled={countdown > 0}>
              <Text
                style={[
                  styles.resendLink,
                  countdown > 0 && { color: colors.textMuted },
                ]}
              >
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 26,
    color: colors.textPrimary,
    lineHeight: 28,
    marginTop: -2,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  lockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  lockIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    marginTop: 4,
    lineHeight: 18,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  editText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginLeft: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  otpBox: {
    width: 44,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#F8FAFF',
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otpText: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  countdownText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  countdownSec: {
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  verifyButton: {
    width: '100%',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  resendPrompt: {
    fontSize: 13,
    color: colors.textMuted,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

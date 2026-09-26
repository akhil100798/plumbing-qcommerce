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

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { loginSuccess } from '../../redux/slices/authSlice';
import { AuthRepository } from '../../services/auth/authRepository';

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
      dispatch(loginSuccess({
        user: {
          id: loginResponse.userId,
          email: loginResponse.email,
          fullName: 'Customer',
          role: loginResponse.role,
          phone: phone,
        },
        token: loginResponse.token,
        refreshToken: loginResponse.refreshToken,
      }));

      // Reset navigation state to Main so the user can't press back to OTP screen
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto verify when all 6 digits are typed
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
            char ? styles.otpBoxFilled : {},
            isFocused ? styles.otpBoxFocused : {},
          ]}
        >
          <Text style={styles.otpBoxText}>{char}</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We've sent a 6 digit code to{'\n'}
            <Text style={styles.phoneText}>{phone}</Text>
          </Text>

          <Pressable style={styles.otpContainer} onPress={handleBoxPress}>
            {renderOtpBoxes()}
          </Pressable>

          {/* Hidden real input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={(val) => setCode(val.replace(/[^0-9]/g, ''))}
            autoFocus
          />

          <View style={styles.timerRow}>
            {countdown > 0 ? (
              <Text style={styles.timerText}>
                Resend OTP in{' '}
                <Text style={styles.countdownText}>
                  00:{countdown < 10 ? `0${countdown}` : countdown}
                </Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={() => setCountdown(25)}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <PrimaryButton
            title="Verify & Proceed"
            onPress={handleVerify}
            loading={loading}
            disabled={code.length < 6}
            style={styles.verifyButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: spacing.layout,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    marginBottom: spacing.giant,
  },
  phoneText: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.huge,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  otpBoxFilled: {
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  otpBoxText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: spacing.giant,
  },
  timerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  countdownText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  resendLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    textDecorationLine: 'underline',
  },
  verifyButton: {
    width: '100%',
  },
});

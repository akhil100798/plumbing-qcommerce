import { CommonActions } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { loginSuccess, logout } from '../../redux/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { tokenStorage } from '../../services/tokenStorage';
import { ProfileRepository } from '../../services/profile/profileRepository';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await tokenStorage.getItem('authToken');
        const refreshToken = await tokenStorage.getItem('refreshToken');
        if (token && refreshToken) {
          const user = await ProfileRepository.getUserProfile();
          dispatch(
            loginSuccess({
              user,
              token,
              refreshToken,
            })
          );

          if (user && user.profileComplete === false) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'CompleteProfile' }],
              })
            );
          } else {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })
            );
          }
          return;
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        dispatch(logout());
      }

      navigation.replace('Onboarding');
    };

    const timer = setTimeout(() => {
      checkAuth();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoIcon}>??</Text>
        </View>
        <Text style={styles.brandTitle}>PlumbCommerce</Text>
        <Text style={styles.brandSub}>Instant Plumbing. Instant Solutions.</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>CUSTOMER APP</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: {
    fontSize: 50,
  },
  brandTitle: {
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  brandSub: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  footer: {
    paddingBottom: spacing.huge,
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  tagText: {
    color: colors.surface,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
});

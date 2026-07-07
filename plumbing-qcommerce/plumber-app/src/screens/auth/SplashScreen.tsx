import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { useDispatch } from 'react-redux';
import { authSuccess, logout } from '../../redux/slices/authSlice';
import { profileService } from '../../services/profile/profileService';
import { tokenStorage } from '../../services/api/tokenStorage';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await tokenStorage.getItem('authToken');
        const refreshToken = await tokenStorage.getItem('refreshToken');

        if (token && refreshToken) {
          // Fetch real user info
          const profile = await profileService.fetchProfile();
          dispatch(
            authSuccess({
              plumber: profile,
              token,
              refreshToken,
            })
          );
          // Redirect to main
          navigation.replace('Main' as any);
        } else {
          dispatch(logout());
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error during splash auth check:', error);
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(checkAuth, 2000);
    return () => clearTimeout(timer);
  }, [navigation, dispatch]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>ðŸ”§</Text>
        </View>
        <Text style={styles.appName}>PlumbCommerce</Text>
        <Text style={styles.appSubtitle}>Plumber App</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color={colors.surface} size="small" />
        <Text style={styles.footerText}>
          Connecting you with more jobs, more earnings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    fontSize: 48,
  },
  appName: {
    fontSize: 28,
    fontWeight: typography.fontWeight.black,
    color: colors.surface,
  },
  appSubtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginBottom: spacing.giant,
    gap: spacing.md,
  },
  footerText: {
    color: colors.primaryLight,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
});

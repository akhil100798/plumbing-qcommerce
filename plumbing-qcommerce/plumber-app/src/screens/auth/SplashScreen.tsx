import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { useDispatch } from 'react-redux';
import { authSuccess, logout } from '../../redux/slices/authSlice';
import { profileService } from '../../services/profile/profileService';
import { tokenStorage } from '../../services/api/tokenStorage';

import LogoMark from '../../assets/icons/logo-mark.svg';
import PlumberHero from '../../assets/illustrations/plumber-splash-hero.svg';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const dispatch = useDispatch();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

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

    const timer = setTimeout(checkAuth, 3000);
    return () => clearTimeout(timer);
  }, [navigation, dispatch, fadeAnim, scaleAnim, floatAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoRow}>
          <LogoMark width={48} height={48} stroke={colors.primary} />
          <Text style={styles.appName}>FixKart</Text>
        </View>
        <Text style={styles.tagline}>Fix it. Fast. Fixed with FixKart.</Text>
      </Animated.View>

      <Animated.View style={[styles.heroContainer, { transform: [{ translateY: floatAnim }] }]}>
        <PlumberHero width={240} height={160} />
      </Animated.View>

      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.footerText}>Partnering in progress...</Text>
        <Text style={styles.versionText}>Ver: 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.giant,
    marginBottom: spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appName: {
    fontSize: 36,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  tagline: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: spacing.giant,
    gap: spacing.xs,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  versionText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

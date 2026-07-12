import { CommonActions } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { loginSuccess, logout } from '../../redux/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { tokenStorage } from '../../services/tokenStorage';
import { ProfileRepository } from '../../services/profile/profileRepository';
import LogoMark from '../../assets/icons/logo-mark.svg';
import SplashHero from '../../assets/illustrations/customer-splash-hero.svg';
import { AppIcon } from '../../components/common/AppIcon';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run premium entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 30,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

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
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, dispatch, logoScale, logoOpacity, textOpacity]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer, 
            { 
              opacity: logoOpacity,
              transform: [{ scale: logoScale }] 
            }
          ]}
        >
          <AppIcon icon={LogoMark} size={70} color={colors.primary} />
        </Animated.View>
        
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={styles.brandTitle}>FixKart</Text>
          <Text style={styles.brandSub}>Fix It. Fast. Fixed.</Text>
          <Text style={styles.slogan}>Plumbing today. Every home solution tomorrow.</Text>
        </Animated.View>

        <View style={styles.heroContainer}>
          <SplashHero width={180} height={120} />
        </View>
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
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
    marginBottom: spacing.xxs,
  },
  brandSub: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  slogan: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  heroContainer: {
    marginTop: spacing.lg,
    opacity: 0.85,
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

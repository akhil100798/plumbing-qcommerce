import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Animated } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { getAuthToken, setAuthToken, setRefreshToken, apiClient } from '../../services/api/axiosClient';
import { tokenStorage } from '../../services/api/tokenStorage';
import { useAppDispatch } from '../../redux/store';
import { authSuccess, logout } from '../../redux/slices/authSlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { User } from '../../types';

import LogoMark from '../../assets/icons/logo-mark.svg';
import StoreSplashHero from '../../assets/illustrations/store-splash-hero.svg';

export const SplashScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating hero animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const token = await getAuthToken();
        const refreshToken = await tokenStorage.getItem('storeRefreshToken');
        if (token && refreshToken) {
          const response = await apiClient.get<User>('/users/me');
          const user = response.data;
          dispatch(authSuccess({ user, token, refreshToken }));
          navigation.navigate('Main', { screen: 'HomeTab' });
        } else {
          dispatch(logout());
          navigation.navigate('Auth', { screen: 'Login' });
        }
      } catch (e) {
        await setAuthToken(null);
        await setRefreshToken(null);
        dispatch(logout());
        navigation.navigate('Auth', { screen: 'Login' });
      }
    };
    checkAuth();
  }, []);

  return (
    <ScreenWrapper backgroundColor={colors.primary} barStyle="light-content" style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale }], opacity }]}>
        <View style={styles.iconBox}>
          <LogoMark width={48} height={48} stroke={colors.primary} />
        </View>
        <Text style={styles.brandTitle}>FixKart</Text>
        <Text style={styles.brandSubtitle}>Store Partner App</Text>
        <Text style={styles.tagline}>Parts that keep every repair going.</Text>
      </Animated.View>

      <Animated.View style={[styles.heroContainer, { transform: [{ translateY: floatAnim }] }]}>
        <StoreSplashHero width={220} height={150} />
      </Animated.View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.card} />
        <Text style={styles.loadingText}>Partnering in progress...</Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: typography.fontWeight.black,
    color: colors.card,
  },
  brandSubtitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.primaryLight,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: typography.fontSize.sm,
    color: colors.primaryLight,
    marginTop: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroContainer: {
    marginVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    color: colors.primaryLight,
    opacity: 0.8,
  },
});

export default SplashScreen;


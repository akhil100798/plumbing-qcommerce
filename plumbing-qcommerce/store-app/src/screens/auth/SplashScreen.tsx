import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { getAuthToken, setAuthToken, setRefreshToken, apiClient } from '../../services/api/axiosClient';
import { tokenStorage } from '../../services/api/tokenStorage';
import { useAppDispatch } from '../../redux/store';
import { authSuccess, logout } from '../../redux/slices/authSlice';
import { AppStackParamList } from '../../types/navigation';
import { User } from '../../types';
import StoreIcon from '../../components/common/StoreIcon';

export function SplashScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const checkAuth = async () => {
      // 1.5s splash display
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
      } catch {
        await setAuthToken(null);
        await setRefreshToken(null);
        dispatch(logout());
        navigation.navigate('Auth', { screen: 'Login' });
      }
    };

    checkAuth();
  }, [dispatch, navigation, pulseAnim, fadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E54DC" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Brand Icon Badge */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <StoreIcon name="store" size={44} color="#FFFFFF" />
          </View>
          <View style={styles.wrenchBadge}>
            <StoreIcon name="wrench" size={16} color="#1EA34A" />
          </View>
        </View>

        {/* Wordmark */}
        <View style={styles.brandRow}>
          <Text style={styles.brandFix}>Fix</Text>
          <Text style={styles.brandKart}>Kart</Text>
        </View>

        <Text style={styles.subtitleBadge}>STORE PARTNER</Text>

        <Text style={styles.tagline}>
          Parts that keep{'\n'}every repair going.
        </Text>
      </Animated.View>

      {/* Footer session check */}
      <View style={styles.footer}>
        <View style={styles.statusPill}>
          <Animated.View style={[styles.glowingDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.statusText}>Checking your partner session...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E54DC',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrenchBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  brandFix: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandKart: {
    fontSize: 38,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: -0.5,
  },
  subtitleBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 2.5,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  glowingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.2,
  },
});

export default SplashScreen;

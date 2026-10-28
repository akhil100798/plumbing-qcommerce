import { CommonActions } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
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
import { StitchBadge } from '../../components/common/StitchBadge';
import { plumberMascotSource } from '../../assets/images/mascot';
import { SvgBrandLogoMark, SvgStatusLightning } from '../../assets/svg';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  const checkAuth = async () => {
    try {
      console.log('[Splash] checking auth tokens...');
      const token = await tokenStorage.getItem('authToken');
      const refreshToken = await tokenStorage.getItem('refreshToken');
      console.log('[Splash] token found:', !!token);
      if (token && refreshToken) {
        console.log('[Splash] fetching user profile...');
        const user = await ProfileRepository.getUserProfile();
        console.log('[Splash] user profile:', user?.id, user?.email);
        dispatch(
          loginSuccess({
            user,
            token,
            refreshToken,
          })
        );

        if (user && user.profileComplete === false) {
          try {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'CompleteProfile' }],
              })
            );
          } catch (e) {
            // Handled by state switch
          }
        }
        try {
          (navigation as any).navigate('Main');
        } catch (e) {}
        return;
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
      dispatch(logout());
    }

    console.log('[Splash] Navigating to Onboarding...');
    navigation.replace('Onboarding');
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      checkAuth();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      checkAuth();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.pressableContent} onPress={handleDismiss}>
      {/* Brand Header */}
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.brandRow,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.brandIconBox}>
            <SvgBrandLogoMark width={56} height={56} />
          </View>
          <Text style={styles.brandTitleFix}>
            Fix<Text style={styles.brandTitleKart}>Kart</Text>
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: contentFade, alignItems: 'center' }}>
          <Text style={styles.tagline}>FIX IT FAST, FIXED.</Text>
          <Text style={styles.subtext}>
            Plumbing made easy. Every solution under one roof.
          </Text>
        </Animated.View>
      </View>

      {/* Mascot Center Section with Floating Badges */}
      <Animated.View style={[styles.mascotSection, { opacity: contentFade }]}>
        <View style={styles.mascotBackdropCircle}>
          <Image
            source={plumberMascotSource}
            style={styles.mascotImage}
            resizeMode="cover"
          />
        </View>

        {/* Floating Verified Badge */}
        <View style={styles.floatingBadgeLeft}>
          <View style={styles.emeraldDot} />
          <Text style={styles.floatingBadgeText}>Verified Pros</Text>
        </View>

        {/* Floating Speed Badge */}
        <View style={styles.floatingBadgeRight}>
          <SvgStatusLightning width={16} height={16} fill="#F59E0B" />
          <View>
            <Text style={styles.speedLabel}>Instant</Text>
            <Text style={styles.speedSub}>Fast Service</Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer Section */}
      <Animated.View style={[styles.footer, { opacity: contentFade }]}>
        <Text style={styles.footerNote}>Experts for your everyday fixes.</Text>
        <View style={styles.appTag}>
          <Text style={styles.appTagText}>CUSTOMER APP</Text>
        </View>
      </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  pressableContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brandIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandIconText: {
    fontSize: 22,
  },
  brandTitleFix: {
    fontSize: 32,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandTitleKart: {
    color: colors.primary,
  },
  tagline: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.5,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  subtext: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 18,
  },
  mascotSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 320,
    height: 280,
  },
  mascotBackdropCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EFF6FF', // blue-50
    borderWidth: 3,
    borderColor: '#93C5FD', // blue-300 crisp border
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  mascotImage: {
    width: 212,
    height: 212,
    borderRadius: 106,
  },
  floatingBadgeLeft: {
    position: 'absolute',
    top: 20,
    left: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emeraldDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.secondary,
    marginRight: 6,
  },
  floatingBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  floatingBadgeRight: {
    position: 'absolute',
    bottom: 24,
    right: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  speedIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  speedLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  speedSub: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  footerNote: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.md,
  },
  appTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  appTagText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.2,
  },
});

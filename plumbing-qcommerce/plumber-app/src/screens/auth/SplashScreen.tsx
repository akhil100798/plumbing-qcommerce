import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { authSuccess, logout } from '../../redux/slices/authSlice';
import { profileService } from '../../services/profile/profileService';
import { tokenStorage } from '../../services/api/tokenStorage';
import { MASCOT_ASSETS } from '../../assets/images/mascot';
import { SvgPlumbWrench } from '../../assets/svg';
import { useNativeDriver } from '../../theme/animation';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

const { width } = Dimensions.get('window');

export function SplashScreen({ navigation }: Props) {
  const dispatch = useDispatch();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver,
      }),
    ]).start();

    // Subtle mascot floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver,
        }),
      ])
    ).start();

    const checkAuth = async () => {
      try {
        const token = await tokenStorage.getItem('authToken');
        const refreshToken = await tokenStorage.getItem('refreshToken');

        if (token && refreshToken) {
          const profile = await profileService.fetchProfile();
          dispatch(
            authSuccess({
              plumber: profile,
              token,
              refreshToken,
            })
          );
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

    const timer = setTimeout(checkAuth, 2500);
    return () => clearTimeout(timer);
  }, [navigation, dispatch, fadeAnim, scaleAnim, floatAnim]);

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <Animated.View style={[styles.brandSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoBadge}>
          <SvgPlumbWrench width={38} height={38} stroke="#0B57CF" fill="none" />
        </View>
        <Text style={styles.wordmark}>
          Fix<Text style={styles.wordmarkHighlight}>Kart</Text>
        </Text>
        <Text style={styles.tagline}>Fix it. Fast. Fixed with FixKart.</Text>
      </Animated.View>

      {/* Mascot Section with City Horizon */}
      <Animated.View style={[styles.mascotContainer, { transform: [{ translateY: floatAnim }] }]}>
        {/* City skyline silhouette bars */}
        <View style={styles.citySkyline}>
          <View style={[styles.building, { height: 70, width: 28, left: 20 }]} />
          <View style={[styles.building, { height: 95, width: 24, left: 55 }]} />
          <View style={[styles.building, { height: 60, width: 30, left: 86 }]} />
          <View style={[styles.building, { height: 110, width: 38, left: 122 }]} />
          <View style={[styles.building, { height: 80, width: 26, left: 168 }]} />
          <View style={[styles.building, { height: 100, width: 36, left: 200 }]} />
          <View style={[styles.building, { height: 75, width: 30, left: 244 }]} />
          <View style={[styles.building, { height: 90, width: 24, left: 280 }]} />
        </View>

        {/* 3D Character Mascot */}
        <Image
          source={MASCOT_ASSETS.mascot}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Footer Version Info */}
      <View style={styles.footer}>
        <ActivityIndicator color="#0B57CF" size="small" style={{ marginBottom: 6 }} />
        <Text style={styles.statusText}>Partnering in progress...</Text>
        <Text style={styles.versionText}>Ver. 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 28,
  },
  brandSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B57CF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E1EDFB',
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0B57CF',
    letterSpacing: -0.5,
  },
  wordmarkHighlight: {
    color: '#002B66',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  mascotContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  citySkyline: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    height: 120,
    opacity: 0.18,
  },
  building: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  mascotImage: {
    width: Math.min(width * 0.8, 300),
    height: 280,
    zIndex: 10,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});

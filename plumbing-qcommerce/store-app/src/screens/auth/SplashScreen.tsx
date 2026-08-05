import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { getAuthToken, setAuthToken, setRefreshToken, apiClient } from '../../services/api/axiosClient';
import { tokenStorage } from '../../services/api/tokenStorage';
import { useAppDispatch } from '../../redux/store';
import { authSuccess, logout } from '../../redux/slices/authSlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { User } from '../../types';

import LogoMark from '../../assets/icons/logo-mark.svg';

const getWindowWidth = () => {
  try {
    return Dimensions?.get ? Dimensions.get('window')?.width || 360 : 360;
  } catch {
    return 360;
  }
};

export function SplashScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();

    const checkAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
  }, [dispatch, navigation, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.center}>
        <View style={styles.logoBadge}>
          <LogoMark width={48} height={48} stroke={colors.primary} />
          <View style={styles.wrenchBadge}>
            <Text style={{ fontSize: 14 }}>🛠</Text>
          </View>
        </View>

        <Text style={styles.brand}>
          Fix<Text style={{ color: colors.success }}>K</Text>art
        </Text>

        <Text style={styles.tagline}>
          Parts that keep{'\n'}every repair going.
        </Text>
      </View>

      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ActivityIndicator color="#FFFFFF" size="small" />
        </Animated.View>
        <Text style={styles.footerText}>Partnering in progress</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  wrenchBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 32,
    fontWeight: typography.fontWeight.black,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  tagline: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  footerText: {
    marginLeft: 8,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
});

export default SplashScreen;

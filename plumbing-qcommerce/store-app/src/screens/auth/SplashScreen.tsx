import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LogoMark from '../../assets/icons/logo-mark.svg';
import { authSuccess, logout } from '../../redux/slices/authSlice';
import { useAppDispatch } from '../../redux/store';
import { apiClient, getAuthToken, setAuthToken, setRefreshToken } from '../../services/api/axiosClient';
import { tokenStorage } from '../../services/api/tokenStorage';
import { storeService } from '../../services/store/storeService';
import { colors, spacing, typography } from '../../theme';
import { User } from '../../types';
import { AppStackParamList } from '../../types/navigation';

export function SplashScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        const refreshToken = await tokenStorage.getItem('storeRefreshToken');

        if (token && refreshToken) {
          const response = await apiClient.get<User>('/users/me');
          const user = response.data;

          // Strict Role enforcement P1 security gate
          const allowedRoles = ['STORE_MANAGER', 'ROLE_STORE_MANAGER'];
          if (!user?.role || !allowedRoles.includes(user.role)) {
            await setAuthToken(null);
            await setRefreshToken(null);
            dispatch(logout());
            navigation.navigate('Auth', { screen: 'Login' });
            return;
          }

          // Resolve assigned store context
          await storeService.getStoreProfile();

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
  }, [dispatch, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.center}>
        <View style={styles.logoBadge}>
          <LogoMark width={48} height={48} stroke={colors.primary} />
          <View style={styles.wrenchBadge}>
            <Text style={{ fontSize: 14 }}>🏬</Text>
          </View>
        </View>

        <Text style={styles.brand}>
          Fix<Text style={{ color: colors.secondary }}>K</Text>art Store
        </Text>

        <Text style={styles.tagline}>
          Hardware inventory & partner{'\n'}fulfillment operations.
        </Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color="#FFFFFF" size="small" />
        <Text style={styles.footerText}>Restoring store session...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'space-between',
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
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  tagline: {
    fontSize: typography.fontSize.xs,
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

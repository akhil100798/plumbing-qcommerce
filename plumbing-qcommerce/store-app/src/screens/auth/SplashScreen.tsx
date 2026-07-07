import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { getAuthToken, setAuthToken, setRefreshToken, apiClient } from '../../services/api/axiosClient';
import { tokenStorage } from '../../services/api/tokenStorage';
import { useAppDispatch } from '../../redux/store';
import { authSuccess, logout } from '../../redux/slices/authSlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { User } from '../../types';

export const SplashScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      <View style={styles.logoContainer}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>??</Text>
        </View>
        <Text style={styles.brandTitle}>PlumbCommerce</Text>
        <Text style={styles.brandSubtitle}>Store Partner</Text>
        <Text style={styles.tagline}>Manage. Deliver. Grow.</Text>
      </View>

      <ActivityIndicator size="large" color={colors.card} style={styles.loader} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconEmoji: {
    fontSize: 42,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: typography.fontWeight.black,
    color: colors.card,
  },
  brandSubtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.primaryLight,
    marginTop: 2,
  },
  tagline: {
    fontSize: typography.fontSize.xs,
    color: colors.primaryLight,
    marginTop: spacing.md,
    letterSpacing: 1.2,
  },
  loader: {
    marginTop: spacing.giant,
  },
});
export default SplashScreen;


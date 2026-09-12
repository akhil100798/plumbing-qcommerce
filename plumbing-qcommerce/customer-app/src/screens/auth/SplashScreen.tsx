import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { FixKartLogo } from '../../assets/svg/Icons';
import { useAuth } from '../../services/authService';

export interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        onFinish();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <FixKartLogo size={48} showText={true} />
        <Text style={styles.tagline}>Plumbing & Home Services in 30 Minutes</Text>
        {isLoading && (
          <ActivityIndicator color={colors.primary} size="small" style={{ marginTop: 24 }} />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Certified Plumbers • 60-Day Guarantee • Transparent Pricing</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: colors.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.outline,
    textAlign: 'center',
    lineHeight: 16,
  },
});

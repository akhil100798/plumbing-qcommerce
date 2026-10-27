import { StackScreenProps } from '@react-navigation/stack';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { StitchButton } from '../../components/common/StitchButton';
import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { plumberMascotSource } from '../../assets/images/mascot';
import { SvgBrandLogoMark } from '../../assets/svg';

type Props = StackScreenProps<AuthStackParamList, 'Onboarding'>;

interface Slide {
  title: string;
  subtitle: string;
  accent: string;
}

const slides: Slide[] = [
  {
    title: 'Expert Plumbing\nAt Your Fingertips',
    subtitle:
      'Find vetted professionals, book instant repairs, and track verified plumbers live right to your door.',
    accent: '#EFF6FF',
  },
  {
    title: 'Quality Hardware\nYou Can Trust',
    subtitle:
      'Order genuine pipes, taps, fittings and spare parts delivered in 10-15 minutes.',
    accent: '#ECFDF5',
  },
  {
    title: 'Transparent Pricing\n& Real Warranties',
    subtitle:
      'Pre-approved quotes, itemized invoices, and digital payment security for every service.',
    accent: '#FFFBEB',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -15, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        setCurrentSlideIndex(currentSlideIndex + 1);
        slideAnim.setValue(15);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 6, useNativeDriver: true }),
        ]).start();
      });
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const currentSlide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <SvgBrandLogoMark width={48} height={48} />
          </View>
          <View>
            <Text style={styles.logoFix}>
              Fix<Text style={styles.logoKart}>Kart</Text>
            </Text>
            <Text style={styles.logoSub}>Customer App</Text>
          </View>
        </View>

        {!isLastSlide ? (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Main Slide Content */}
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.mascotCircle, { backgroundColor: currentSlide.accent }]}>
          <Animated.Image
            source={plumberMascotSource}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
      </Animated.View>

      {/* Bottom Actions & Pagination */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentSlideIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <StitchButton
          title={isLastSlide ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          variant="primary"
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  logoWrench: {
    fontSize: 18,
  },
  logoFix: {
    fontSize: 18,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  logoKart: {
    color: colors.primary,
  },
  logoSub: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
  },
  skipText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  mascotCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  mascotImage: {
    width: 210,
    height: 210,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: spacing.layout,
    paddingBottom: spacing.huge,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.borderDark,
  },
  continueButton: {
    width: '100%',
  },
});

import { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { tokenStorage } from '../../services/tokenStorage';
import SplashHero from '../../assets/illustrations/customer-splash-hero.svg';
import PlumberHero from '../../assets/illustrations/plumber-service-hero.svg';
import ServicesBanner from '../../assets/illustrations/home-services-banner.svg';

type Props = StackScreenProps<AuthStackParamList, 'Onboarding'>;

interface Slide {
  title: string;
  subtitle: string;
  accent: string;
}

const slides: Slide[] = [
  {
    title: 'Plumbing Help\nIn Minutes',
    subtitle: 'Book expert plumbers, order materials, or get emergency solutions at your doorstep.',
    accent: colors.surfaceContainerLow || '#EFF4FF',
  },
  {
    title: 'Quality You Can\nTrust',
    subtitle: 'KYC verified plumbers, genuine Q-commerce parts, and instant dispatch.',
    accent: colors.secondaryContainer || '#D5E0F8',
  },
  {
    title: 'Direct Store\nPickup & Service',
    subtitle: 'Plumbers collect required materials directly from local stores for fast repairs.',
    accent: colors.surfaceContainer || '#E5EEFF',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const completeOnboarding = async () => {
    try {
      await tokenStorage.setItem('hasCompletedOnboarding', 'true');
    } catch (err) {
      console.error('Failed to set onboarding flag:', err);
    }
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        setCurrentSlideIndex(currentSlideIndex + 1);
        slideAnim.setValue(20);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 6, useNativeDriver: true }),
        ]).start();
      });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const currentSlide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === slides.length - 1;

  const getIllustration = (index: number) => {
    switch (index) {
      case 0:
        return <SplashHero width={180} height={120} />;
      case 1:
        return <PlumberHero width={180} height={120} />;
      case 2:
        return <ServicesBanner width={180} height={120} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} accessibilityRole="button" accessibilityLabel="Skip onboarding">
          <Text style={styles.skipText}>{isLastSlide ? '' : 'Skip'}</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.slideContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.imageContainer, { backgroundColor: currentSlide.accent }]}>
          {getIllustration(currentSlideIndex)}
        </View>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
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

        <PrimaryButton
          title={isLastSlide ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.huge,
  },
  imageContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.headingLg,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed,
    paddingHorizontal: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.layout,
    paddingBottom: spacing.huge,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: borderRadius.full,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primaryContainer || colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.borderDark || '#727785',
  },
  nextButton: {
    width: '100%',
  },
});


import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AuthStackParamList, 'Onboarding'>;

interface Slide {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
}

const slides: Slide[] = [
  {
    title: 'Plumbing Help\nIn Minutes',
    subtitle: 'Book plumbers, order materials or get expert solutions at your doorstep.',
    icon: '🛵',
    accent: '#E6F4FE',
  },
  {
    title: 'Quality You Can\nTrust',
    subtitle: 'Verified plumbers, genuine materials and secure payments.',
    icon: '🛡️',
    accent: '#ECFDF5',
  },
  {
    title: 'Fast Delivery\n& Service',
    subtitle: 'From quick deliveries to emergency repairs, we are always here.',
    icon: '⏱️',
    accent: '#FFFBEB',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>{isLastSlide ? '' : 'Skip'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slideContainer}>
        <View style={[styles.imageContainer, { backgroundColor: currentSlide.accent }]}>
          <Text style={styles.illustrationIcon}>{currentSlide.icon}</Text>
        </View>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
      </View>

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
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
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
  illustrationIcon: {
    fontSize: 90,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
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
    borderRadius: borderRadius.round,
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
  nextButton: {
    width: '100%',
  },
});

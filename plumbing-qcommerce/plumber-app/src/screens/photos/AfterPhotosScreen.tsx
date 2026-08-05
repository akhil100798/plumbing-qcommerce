import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PhotoGrid } from '../../components/common/PhotoGrid';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

const MIN_PHOTOS = 3;

type Props = StackScreenProps<AppStackParamList, 'AfterPhotos'>;

export function AfterPhotosScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [photos, setPhotos] = useState<string[]>([]);

  const handleAddPhoto = async () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400',
    ];
    const nextUri = mockPhotos[photos.length % mockPhotos.length];
    setPhotos((prev) => [...prev, nextUri]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = photos.length >= MIN_PHOTOS;

  const handleContinue = () => {
    if (!canProceed) {
      Alert.alert('Upload Required', `Add at least ${MIN_PHOTOS} photos of completed work before proceeding.`);
      return;
    }
    navigation.navigate('CompleteService', { jobId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="After Photos" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>Capture clear photos</Text>
        <Text style={styles.subheading}>after completing the work.</Text>

        <View style={styles.gridWrapper}>
          <PhotoGrid
            photos={photos}
            minPhotos={MIN_PHOTOS}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
          />
        </View>

        {!canProceed && (
          <Text style={styles.hint}>Add at least {MIN_PHOTOS} photos to continue.</Text>
        )}

        <View style={styles.spacer} />

        <PrimaryButton
          title="Next"
          onPress={handleContinue}
          disabled={!canProceed}
          style={canProceed ? styles.nextButton : styles.nextButtonDisabled}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flexGrow: 1, paddingHorizontal: spacing.layout, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  heading: { fontSize: 22, fontWeight: typography.fontWeight.black, color: colors.textPrimary, textAlign: 'center' },
  subheading: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  gridWrapper: { marginTop: spacing.lg },
  hint: { fontSize: typography.fontSize.xs, color: colors.warning, marginTop: spacing.md, textAlign: 'center', fontWeight: typography.fontWeight.bold },
  spacer: { flex: 1 },
  nextButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.xl,
  },
  nextButtonDisabled: { opacity: 0.5, marginTop: spacing.xl },
});

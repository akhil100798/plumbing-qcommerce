import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PhotoGrid } from '../../components/common/PhotoGrid';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { photoService, JobPhoto } from '../../services/photos/photoService';

const MIN_PHOTOS = 3;

type Props = StackScreenProps<AppStackParamList, 'AfterPhotos'>;

export function AfterPhotosScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    photoService.list(jobId, 'AFTER').then(setPhotos).catch((error: Error) =>
      Alert.alert('Unable to load photos', error.message || 'Please try again.')
    ).finally(() => setLoading(false));
  }, [jobId]);

  const handleAddPhoto = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const photo = await photoService.pickAndUpload(jobId, 'AFTER');
      if (photo) setPhotos((current) => [...current, photo]);
    } catch (error: any) {
      Alert.alert('Upload failed', error.message || 'Unable to upload this image. Please try again.');
    } finally {
      setUploading(false);
    }
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
          />
        </View>

        {!canProceed && (
          <Text style={styles.hint}>Photo capture is required before continuing.</Text>
        )}

        <View style={styles.spacer} />

        <PrimaryButton
          title={uploading ? 'Uploading...' : 'Next'}
          onPress={handleContinue}
          disabled={!canProceed || uploading || loading}
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

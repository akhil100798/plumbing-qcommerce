import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PhotoGrid } from '../../components/common/PhotoGrid';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { JobPhoto, photoService } from '../../services/photos/photoService';

const MIN_PHOTOS = 3;

type Props = StackScreenProps<AppStackParamList, 'BeforePhotos'>;

export function BeforePhotosScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    photoService
      .list(jobId, 'BEFORE')
      .then((loadedPhotos) => {
        if (mounted) setPhotos(loadedPhotos);
      })
      .catch((error: Error) => {
        if (mounted) Alert.alert('Unable to load photos', error.message || 'Please try again.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [jobId]);

  const handleAddPhoto = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const photo = await photoService.pickAndUpload(jobId, 'BEFORE');
      if (photo) setPhotos((current) => [...current, photo]);
    } catch (error: any) {
      Alert.alert('Upload failed', error.message || 'Unable to upload this image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const canProceed = photos.length >= MIN_PHOTOS;

  const handleNextWithMaterials = () => {
    if (!canProceed) {
      Alert.alert('Upload Required', `Add at least ${MIN_PHOTOS} photos before requesting materials.`);
      return;
    }
    navigation.navigate('StoreSelection', { jobId });
  };

  const handleNextNoMaterials = () => {
    if (!canProceed) {
      Alert.alert('Upload Required', `Add at least ${MIN_PHOTOS} photos before proceeding.`);
      return;
    }
    navigation.navigate('AfterPhotos', { jobId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Before Photos" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>Capture clear photos</Text>
        <Text style={styles.subheading}>before starting the work.</Text>

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

        <View style={styles.actionBlock}>
          <SecondaryButton
            title={uploading ? 'Uploading...' : 'Request Parts from Store'}
            onPress={handleNextWithMaterials}
            disabled={!canProceed || loading || uploading}
            style={styles.partsBtn}
            textColor={colors.primary}
          />
          <PrimaryButton
            title="Proceed to After Photos"
            onPress={handleNextNoMaterials}
            disabled={!canProceed || loading || uploading}
            style={canProceed ? styles.nextButton : styles.nextButtonDisabled}
          />
        </View>
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
  actionBlock: { gap: spacing.sm, marginTop: spacing.xl },
  partsBtn: { width: '100%', borderColor: colors.primary },
  nextButton: {
    backgroundColor: colors.primary,
  },
  nextButtonDisabled: { opacity: 0.5 },
});

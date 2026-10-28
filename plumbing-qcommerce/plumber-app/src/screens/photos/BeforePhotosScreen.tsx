import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PhotoGrid } from '../../components/common/PhotoGrid';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

const MIN_PHOTOS = 2;

type Props = StackScreenProps<AppStackParamList, 'BeforePhotos'>;

export function BeforePhotosScreen({ route, navigation }: Props) {
  const { jobId = 'JOB-1024' } = (route as any)?.params || {};
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&q=80&w=400',
  ]);

  const handleAddPhoto = async () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400',
    ];
    const nextUri = mockPhotos[photos.length % mockPhotos.length];
    setPhotos((prev) => [...prev, nextUri]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
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
      <AppHeader
        title="Before Photos"
        variant="blue"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stitch Instructions */}
        <View style={styles.instructionWrap}>
          <Text style={styles.heading}>Capture clear photos</Text>
          <Text style={styles.subheading}>before starting the work</Text>
        </View>

        {/* Stitch Photos Grid */}
        <View style={styles.gridWrapper}>
          <PhotoGrid
            photos={photos}
            slots={4}
            badgeType="tag"
            tagPrefix="Photo"
            minPhotos={MIN_PHOTOS}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
          />
        </View>

        {!canProceed && (
          <Text style={styles.hint}>Add at least {MIN_PHOTOS} photos to continue.</Text>
        )}

        <View style={styles.spacer} />

        {/* Stitch Bottom Actions */}
        <View style={styles.actionBlock}>
          <SecondaryButton
            title="Request Parts from Store"
            onPress={handleNextWithMaterials}
            disabled={!canProceed}
            style={styles.partsBtn}
            textColor={colors.stitchBlue}
          />
          <PrimaryButton
            title="Next"
            onPress={handleNextNoMaterials}
            disabled={!canProceed}
            variant="blue"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  instructionWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  gridWrapper: {
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  actionBlock: {
    gap: 12,
  },
  partsBtn: {
    borderColor: colors.stitchBlue,
    borderWidth: 1.5,
  },
});

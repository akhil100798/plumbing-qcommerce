import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PhotoGrid } from '../../components/common/PhotoGrid';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

const MIN_PHOTOS = 2;

type Props = StackScreenProps<AppStackParamList, 'AfterPhotos'>;

export function AfterPhotosScreen({ route, navigation }: Props) {
  const { jobId = 'JOB-1024' } = (route as any)?.params || {};
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400',
  ]);

  const handleAddPhoto = async () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400',
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
      <AppHeader
        title="After Photos"
        variant="blue"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stitch Instructions */}
        <View style={styles.instructionWrap}>
          <Text style={styles.heading}>Capture clear photos</Text>
          <Text style={styles.subheading}>after completing the work</Text>
        </View>

        {/* Stitch Photo Grid with Verified Green Badges */}
        <View style={styles.gridWrapper}>
          <PhotoGrid
            photos={photos}
            slots={4}
            badgeType="check"
            minPhotos={MIN_PHOTOS}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
          />
        </View>

        {!canProceed && (
          <Text style={styles.hint}>Add at least ${MIN_PHOTOS} photos to continue.</Text>
        )}

        <View style={styles.spacer} />

        <PrimaryButton
          title="Next"
          onPress={handleContinue}
          disabled={!canProceed}
          variant="blue"
        />
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
});

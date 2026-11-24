import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
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
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      let result;
      if (permission.granted) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      }
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (err) {
      console.warn('Camera capture error, falling back to gallery:', err);
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotos((prev) => [...prev, result.assets[0].uri]);
        }
      } catch (galleryErr) {
        Alert.alert('Camera Error', 'Could not open camera or image gallery.');
      }
    }
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

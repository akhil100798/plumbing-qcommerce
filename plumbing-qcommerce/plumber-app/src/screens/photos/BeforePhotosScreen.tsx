import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { PhotoUploadBox } from '../../components/forms/PhotoUploadBox';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'BeforePhotos'>;

export function BeforePhotosScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleCapture = () => {
    // Simulate camera snapshot capture
    setPhotoUri('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400');
    Alert.alert('Photo Captured', 'Before work photo has been successfully attached!');
  };

  const handleNextWithMaterials = () => {
    if (!photoUri) {
      Alert.alert('Upload Required', 'Please capture a photo of the issue before proceeding.');
      return;
    }
    navigation.navigate('MaterialRequest', { jobId });
  };

  const handleNextNoMaterials = () => {
    if (!photoUri) {
      Alert.alert('Upload Required', 'Please capture a photo of the issue before proceeding.');
      return;
    }
    // Proceed directly to After Photos Screen (simulate work finished)
    navigation.navigate('AfterPhotos', { jobId });
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Before Photos" onBackPress={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.instructions}>
          <Text style={styles.title}>Before Work Photos</Text>
          <Text style={styles.subtitle}>
            Take clear photos of the issue before starting the work.
          </Text>
        </View>

        <View style={styles.uploadWrapper}>
          <PhotoUploadBox
            imageUri={photoUri}
            onPress={handleCapture}
            title="Snap Before Work Setup"
          />
        </View>

        <View style={styles.thumbnailGrid}>
          <View style={styles.thumbnailSlot}>
            <Text style={styles.thumbnailIcon}>📸</Text>
          </View>
          <View style={styles.thumbnailSlot}>
            <Text style={styles.thumbnailIcon}>📸</Text>
          </View>
          <View style={styles.thumbnailSlot}>
            <Text style={styles.thumbnailIcon}>📸</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.actionBlock}>
          <SecondaryButton
            title="Request Parts from Store"
            onPress={handleNextWithMaterials}
            style={styles.partsBtn}
            textStyle={styles.partsBtnText}
          />
          <PrimaryButton
            title="Work Finished (No Parts)"
            onPress={handleNextNoMaterials}
            style={styles.continueBtn}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
    flexGrow: 1,
  },
  instructions: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.tight,
  },
  uploadWrapper: {
    marginBottom: spacing.xl,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  thumbnailSlot: {
    flex: 1,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  spacer: {
    flex: 1,
  },
  actionBlock: {
    gap: spacing.md,
    marginTop: 'auto',
  },
  partsBtn: {
    width: '100%',
    borderColor: colors.primary,
  },
  partsBtnText: {
    color: colors.primary,
  },
  continueBtn: {
    width: '100%',
  },
});

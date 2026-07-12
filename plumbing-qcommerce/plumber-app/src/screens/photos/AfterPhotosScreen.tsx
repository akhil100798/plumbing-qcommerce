import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { PhotoUploadBox } from '../../components/forms/PhotoUploadBox';
import { canUseDevMockFallbacks } from '../../services/mockPolicy';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'AfterPhotos'>;

export function AfterPhotosScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const devMode = canUseDevMockFallbacks();

  const handleCapture = () => {
    setPhotoUri('https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400');
    Alert.alert('Photo Captured', 'After work photo has been successfully attached!');
  };

  const handleContinue = () => {
    if (!photoUri) {
      Alert.alert('Upload Required', 'Please capture a photo of the completed repair before proceeding.');
      return;
    }
    navigation.navigate('CompleteService', { jobId });
  };

  return (
    <ScreenWrapper>
      <AppHeader title="After Photos" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.instructions}>
          <Text style={styles.title}>After Work Photos</Text>
          <Text style={styles.subtitle}>Take clear photos of the setup after completing the work.</Text>
        </View>

        <View style={styles.uploadWrapper}>
          <PhotoUploadBox imageUri={photoUri} onPress={handleCapture} title="Snap Completed Repair" />
        </View>

        <View style={styles.thumbnailGrid}>
          <View style={styles.thumbnailSlot}><Text style={styles.thumbnailIcon}>📸</Text></View>
          <View style={styles.thumbnailSlot}><Text style={styles.thumbnailIcon}>📸</Text></View>
          <View style={styles.thumbnailSlot}><Text style={styles.thumbnailIcon}>📸</Text></View>
        </View>

        <View style={styles.spacer} />
        <PrimaryButton title="Continue" onPress={handleContinue} style={styles.actionBtn} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.layout, paddingBottom: spacing.huge, flexGrow: 1 },
  instructions: { marginBottom: spacing.xl },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.black, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: typography.lineHeight.tight },
  noticeText: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.md },
  uploadWrapper: { marginBottom: spacing.xl },
  thumbnailGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.xl },
  thumbnailSlot: { flex: 1, height: 72, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderDark, borderStyle: 'dashed', backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  thumbnailIcon: { fontSize: 18, color: colors.textMuted },
  spacer: { flex: 1 },
  actionBtn: { width: '100%' },
});

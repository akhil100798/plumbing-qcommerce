import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface PhotoUploadBoxProps {
  imageUri: string | null;
  onPress: () => void;
  title?: string;
}

export function PhotoUploadBox({
  imageUri,
  onPress,
  title = 'Take Photo',
}: PhotoUploadBoxProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {imageUri ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.retakeBadge}>
            <Text style={styles.retakeText}>Retake 📷</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.cameraIcon}>📸</Text>
          <Text style={styles.uploadText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  retakeBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.darkOverlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  retakeText: {
    color: colors.surface,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 48,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  uploadText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
});

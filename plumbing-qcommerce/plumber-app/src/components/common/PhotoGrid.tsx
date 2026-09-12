import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import CameraIcon from '../../assets/icons/camera.svg';
import CloseIcon from '../../assets/icons/close.svg';
import { colors, spacing, borderRadius, typography } from '../../theme';

export type PhotoItem = string | { uri?: string } | null | undefined;

interface PhotoGridProps {
  photos?: PhotoItem[];
  slots?: number;
  minPhotos?: number;
  onAddPhoto?: () => void;
  onRemovePhoto?: (index: number) => void;
}

export function PhotoGrid({
  photos = [],
  slots = 4,
  onAddPhoto,
  onRemovePhoto,
}: PhotoGridProps) {
  const cells = Array.from({ length: slots }, (_, i) => photos[i] || null);

  const getPhotoUri = (photo: PhotoItem): string | undefined => {
    if (!photo) return undefined;
    if (typeof photo === 'string') return photo;
    return photo.uri;
  };

  return (
    <View style={styles.grid}>
      {cells.map((photo, idx) => {
        const uri = getPhotoUri(photo);
        return (
          <View key={idx} style={styles.cellWrap}>
            {photo ? (
              <View style={styles.cell}>
                {uri ? (
                  <Image source={{ uri }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={styles.invalidPhoto}>
                    <Text style={styles.invalidPhotoText}>Photo unavailable</Text>
                  </View>
                )}
                {onRemovePhoto ? (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => onRemovePhoto(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${idx + 1}`}
                  >
                    <CloseIcon width={12} height={12} stroke="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.cell, styles.emptyCell]}
                onPress={onAddPhoto}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Add photo ${idx + 1}`}
              >
                <CameraIcon width={26} height={26} stroke={colors.textMuted} />
                <Text style={styles.addLabel}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  cellWrap: {
    width: '50%',
    padding: spacing.xs,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  emptyCell: {
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  invalidPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invalidPhotoText: { color: colors.error, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import CameraIcon from '../../assets/icons/camera.svg';
import CloseIcon from '../../assets/icons/close.svg';

const windowWidth = Dimensions?.get ? Dimensions.get('window')?.width || 360 : 360;
const TILE = (windowWidth - spacing.layout * 2 - spacing.sm * 2) / 3;

interface PhotoGridProps {
  photos: string[];
  minPhotos?: number;
  onAddPhoto: () => void;
  onRemovePhoto?: (index: number) => void;
}

export function PhotoGrid({ photos, minPhotos = 3, onAddPhoto, onRemovePhoto }: PhotoGridProps) {
  const slots = Array.from({ length: Math.max(minPhotos + 1, photos.length + 1) });

  return (
    <View style={styles.grid}>
      {slots.map((_, index) => {
        const photo = photos[index];
        if (photo) {
          return (
            <View key={index} style={styles.tile}>
              <Image source={{ uri: photo }} style={styles.image} />
              {onRemovePhoto && (
                <TouchableOpacity style={styles.removeBadge} onPress={() => onRemovePhoto(index)}>
                  <CloseIcon width={12} height={12} stroke="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          );
        }
        if (index === photos.length) {
          return (
            <TouchableOpacity key={index} style={[styles.tile, styles.addTile]} onPress={onAddPhoto}>
              <CameraIcon width={22} height={22} stroke={colors.textMuted} />
              <Text style={styles.addLabel}>Add Photo</Text>
            </TouchableOpacity>
          );
        }
        return <View key={index} style={{ width: TILE }} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  addTile: {
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 3,
  },
});

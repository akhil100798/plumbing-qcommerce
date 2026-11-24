import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import CameraIcon from '../../assets/icons/camera.svg';
import CloseIcon from '../../assets/icons/close.svg';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { SvgActionCheck } from '../../assets/svg';

export type PhotoItem = string | { uri?: string } | null | undefined;

interface PhotoGridProps {
  photos?: PhotoItem[];
  slots?: number;
  minPhotos?: number;
  badgeType?: 'tag' | 'check' | 'none';
  tagPrefix?: string;
  onAddPhoto?: () => void;
  onRemovePhoto?: (index: number) => void;
}

export function PhotoGrid({
  photos = [],
  slots = 4,
  badgeType = 'tag',
  tagPrefix = 'Photo',
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
                  <View style={styles.mockThumb}>
                    <CameraIcon width={28} height={28} stroke="#94A3B8" />
                  </View>
                )}

                {/* Stitch Photo Tag / Badge */}
                {badgeType === 'tag' && (
                  <View style={styles.tagOverlay}>
                    <Text style={styles.tagText}>{tagPrefix} {idx + 1}</Text>
                  </View>
                )}

                {badgeType === 'check' && (
                  <View style={styles.checkBadge}>
                    <SvgActionCheck width={12} height={12} fill="#FFFFFF" />
                  </View>
                )}

                {onRemovePhoto ? (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => onRemovePhoto(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Remove photo"
                  >
                    <CloseIcon width={10} height={10} stroke="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.cell, styles.emptyCell]}
                onPress={onAddPhoto}
                activeOpacity={0.7}
                accessibilityLabel="Add photo"
              >
                <View style={styles.cameraCircle}>
                  <CameraIcon width={24} height={24} stroke="#64748B" />
                </View>
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
    marginHorizontal: -6,
  },
  cellWrap: {
    width: '50%',
    padding: 6,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...shadows.sm,
  },
  emptyCell: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#FAFBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  addLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  mockThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import StarIcon from '../../assets/icons/star.svg';
import { colors, spacing } from '../../theme';

interface StarRatingProps {
  rating?: number;
  max?: number;
  size?: number;
}

export function StarRating({ rating = 5, max = 5, size = 20 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => (
        <StarIcon
          key={i}
          width={size}
          height={size}
          fill={i < rating ? colors.warning : 'none'}
          stroke={colors.warning}
          style={styles.star}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  star: { marginRight: spacing.xs / 2 },
});

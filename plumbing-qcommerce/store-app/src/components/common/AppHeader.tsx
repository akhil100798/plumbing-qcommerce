import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Called when the back button is pressed. Accepts onBack or onBackPress for compatibility. */
  onBack?: () => void;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onBackPress,
  rightAction,
}) => {
  const handleBack = onBackPress ?? onBack;

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {handleBack && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeftIcon width={20} height={20} stroke={colors.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.textContainer}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          {subtitle && <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  rightAction: {
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
});

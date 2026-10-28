import React from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';
import { StoreIcon } from './StoreIcon';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
}) => {
  return (
    <View style={styles.container}>
      <StoreIcon name="search" size={16} color={colors.textSecondary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <StoreIcon name="close" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },
  clearButton: {
    padding: spacing.xs,
  },
});

export default SearchInput;

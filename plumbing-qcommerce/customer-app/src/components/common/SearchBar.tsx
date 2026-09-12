import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { SearchIcon, ChevronRightIcon } from "../../assets/svg/Icons";

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
  editable?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search 'Tap repair', 'CPVC pipes', 'Geyser'...",
  onPress,
  onClear,
  autoFocus = false,
  editable = true,
}) => {
  const content = (
    <View style={styles.container}>
      <SearchIcon size={20} color={colors.primary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        editable={editable}
        pointerEvents={editable ? "auto" : "none"}
      />
    </View>
  );

  if (!editable && onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryFixed,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginVertical: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body2,
    color: colors.onBackground,
    padding: 0,
  },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export type StatusType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "primary"
  | "neutral";

interface StatusChipProps {
  status: StatusType;
  label: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string }> = {
  success: { bg: colors.successContainer, text: colors.onSuccess },
  warning: { bg: colors.warningContainer, text: colors.onWarning },
  error: { bg: colors.errorContainer, text: colors.onErrorContainer },
  info: { bg: colors.infoContainer, text: colors.onInfo },
  primary: { bg: colors.primaryFixed, text: colors.primary },
  neutral: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
  const config = statusConfig[status] || statusConfig.neutral;

  return (
    <View style={[styles.chip, { backgroundColor: config.bg }]}>
      <Text style={[styles.chipText, { color: config.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  chipText: {
    ...typography.label,
    fontSize: 11,
  },
});
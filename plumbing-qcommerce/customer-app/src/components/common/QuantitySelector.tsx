import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: "small" | "medium";
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  size = "medium",
}) => {
  const isSmall = size === "small";

  return (
    <View style={[styles.container, isSmall && styles.smallContainer]}>
      <TouchableOpacity
        style={[styles.btn, isSmall && styles.smallBtn]}
        onPress={onDecrease}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={[styles.qtyText, isSmall && styles.smallQtyText]}>{quantity}</Text>
      <TouchableOpacity
        style={[styles.btn, isSmall && styles.smallBtn]}
        onPress={onIncrease}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    overflow: "hidden",
  },
  smallContainer: {
    borderRadius: 6,
  },
  btn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryFixed,
  },
  smallBtn: {
    width: 22,
    height: 22,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  qtyText: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.onBackground,
  },
  smallQtyText: {
    paddingHorizontal: 6,
    fontSize: 11,
  },
});

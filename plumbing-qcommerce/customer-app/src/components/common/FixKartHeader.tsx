import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { FixKartLogo, LocationPinIcon, BellIcon, ChevronRightIcon } from "../../assets/svg/Icons";
import { useAuth } from "../../services/authService";

interface FixKartHeaderProps {
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
}

export const FixKartHeader: React.FC<FixKartHeaderProps> = ({
  onLocationPress,
  onNotificationPress,
}) => {
  const { selectedAddress } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <FixKartLogo size={32} showText={true} />
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <BellIcon size={22} color={colors.onBackground} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.locationBar}
        onPress={onLocationPress}
        activeOpacity={0.8}
      >
        <View style={styles.locationPinWrapper}>
          <LocationPinIcon size={18} color={colors.primary} />
        </View>
        <View style={styles.locationInfo}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.locationType}>
              {selectedAddress.type.toUpperCase()}
            </Text>
            <ChevronRightIcon size={14} color={colors.secondary} />
          </View>
          <Text style={styles.locationAddress} numberOfLines={1}>
            {selectedAddress.flat}, {selectedAddress.area}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    position: "absolute",
    top: 8,
    right: 9,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 10,
  },
  locationPinWrapper: {
    marginRight: spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationType: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
    marginRight: 2,
  },
  locationAddress: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
});

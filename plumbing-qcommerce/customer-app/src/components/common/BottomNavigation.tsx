import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { HomeIcon, SearchIcon, BookingsIcon, CartIcon, ProfileIcon } from "../../assets/svg/Icons";
import { useCart } from "../../services/cartService";

export type TabRoute = "home" | "search" | "orders" | "cart" | "profile";

interface BottomNavigationProps {
  activeTab: TabRoute;
  onTabPress: (tab: TabRoute) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { itemCount } = useCart();

  const tabs: { id: TabRoute; label: string; icon: React.FC<{ size?: number; color?: string }> }[] = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "search", label: "Search", icon: SearchIcon },
    { id: "orders", label: "Bookings", icon: BookingsIcon },
    { id: "cart", label: "Cart", icon: CartIcon },
    { id: "profile", label: "Profile", icon: ProfileIcon },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;
        const tint = isActive ? colors.primary : colors.secondary;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <IconComponent size={24} color={tint} />
              {tab.id === "cart" && itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: tint, fontWeight: isActive ? "700" : "500" }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 64,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  iconWrapper: {
    position: "relative",
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 11,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.onError,
    fontSize: 9,
    fontWeight: "700",
  },
});

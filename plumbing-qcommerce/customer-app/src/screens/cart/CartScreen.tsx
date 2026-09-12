import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { useCart } from "../../services/cartService";
import { useAuth } from "../../services/authService";
import { QuantitySelector } from "../../components/common/QuantitySelector";
import {
  CartIcon,
  LocationPinIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "../../assets/svg/Icons";

interface CartScreenProps {
  onBack: () => void;
  onNavigateToCheckout: () => void;
  onNavigateToHome: () => void;
  onNavigateToSavedAddresses: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onBack,
  onNavigateToCheckout,
  onNavigateToHome,
  onNavigateToSavedAddresses,
}) => {
  const {
    items,
    updateQuantity,
    subtotal,
    visitingFee,
    tax,
    discount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { selectedAddress } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState(false);

  const handleApplyCoupon = () => {
    const success = applyCoupon(couponCode);
    if (!success) {
      setCouponError(true);
    } else {
      setCouponError(false);
      setCouponCode("");
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ChevronLeftIcon size={22} color={colors.onBackground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
        </View>

        <View style={styles.emptyContent}>
          <CartIcon size={64} color={colors.outline} />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Add tap repairs, pipe fittings, or plumbing services to get started.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={onNavigateToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreBtnText}>Explore Services & Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeftIcon size={22} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Cart ({items.length} items)</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Address Card */}
        <TouchableOpacity
          style={styles.addressCard}
          onPress={onNavigateToSavedAddresses}
          activeOpacity={0.8}
        >
          <LocationPinIcon size={20} color={colors.primary} />
          <View style={styles.addressInfo}>
            <Text style={styles.addressType}>
              Service Location ({selectedAddress.type.toUpperCase()})
            </Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {selectedAddress.flat}, {selectedAddress.area}
            </Text>
          </View>
          <Text style={styles.changeBtnText}>CHANGE</Text>
        </TouchableOpacity>

        {/* Cart Items List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionHeader}>Selected Services & Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemTypeBadge}>
                  {item.itemType === "service" ? "SERVICE" : "SPARE PART"}
                </Text>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  {item.originalPrice > item.price && (
                    <Text style={styles.itemOriginalPrice}>
                      ₹{item.originalPrice * item.quantity}
                    </Text>
                  )}
                </View>
              </View>
              <QuantitySelector
                size="small"
                quantity={item.quantity}
                onIncrease={() => updateQuantity(item.id, 1)}
                onDecrease={() => updateQuantity(item.id, -1)}
              />
            </View>
          ))}
        </View>

        {/* Coupons Section */}
        <View style={styles.couponSection}>
          <Text style={styles.sectionHeader}>Offers & Coupons</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCouponBox}>
              <View>
                <Text style={styles.appliedCouponCode}>✓ {appliedCoupon} APPLIED</Text>
                <Text style={styles.appliedCouponDesc}>You saved ₹{discount} on this booking!</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                value={couponCode}
                onChangeText={(t) => {
                  setCouponCode(t);
                  setCouponError(false);
                }}
                placeholder="Enter coupon (e.g. FIXFIRST50)"
                placeholderTextColor={colors.outline}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyCoupon}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          )}
          {couponError && (
            <Text style={styles.couponErrorText}>Invalid code. Try FIXFIRST50</Text>
          )}
        </View>

        {/* Bill Breakdown */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Visiting & Inspection Fee</Text>
            <Text style={styles.billValue}>₹{visitingFee}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & GST (5%)</Text>
            <Text style={styles.billValue}>₹{tax}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, styles.discountLabel]}>Coupon Discount</Text>
              <Text style={[styles.billValue, styles.discountValue]}>−₹{discount}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        {/* Cancellation policy */}
        <View style={styles.policyCard}>
          <ShieldCheckIcon size={18} color={colors.primary} />
          <Text style={styles.policyText}>
            Free cancellation up to 15 minutes before scheduled arrival time.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Checkout CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalPrice}>₹{total}</Text>
        </View>

        <TouchableOpacity
          style={styles.proceedBtn}
          onPress={onNavigateToCheckout}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedBtnText}>Proceed to Checkout</Text>
          <ChevronRightIcon size={16} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.onBackground,
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: "700",
    color: colors.onBackground,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: "400",
    color: colors.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  exploreBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: "600",
    color: colors.onPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  addressInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  addressType: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  addressText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.onBackground,
    marginTop: 2,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },
  itemsSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: "700",
    color: colors.secondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    marginRight: spacing.sm,
  },
  itemInfo: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  itemTypeBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.secondary,
  },
  itemTitle: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: "600",
    color: colors.onBackground,
    lineHeight: 18,
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onBackground,
    marginRight: 6,
  },
  itemOriginalPrice: {
    fontSize: 11,
    color: colors.secondary,
    textDecorationLine: "line-through",
  },
  couponSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  couponInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.onBackground,
    fontWeight: "600",
  },
  applyBtn: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  appliedCouponBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.successContainer,
    padding: 12,
    borderRadius: 10,
  },
  appliedCouponCode: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.onSuccess,
  },
  appliedCouponDesc: {
    fontSize: 11,
    color: colors.onSuccess,
    marginTop: 2,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.error,
  },
  couponErrorText: {
    fontSize: 11,
    color: colors.error,
    marginTop: 6,
  },
  billCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  billTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: "600",
    color: colors.onBackground,
    marginBottom: spacing.md,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  billLabel: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    color: colors.secondary,
  },
  billValue: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: "600",
    color: colors.onBackground,
  },
  discountLabel: {
    color: colors.success,
    fontWeight: "600",
  },
  discountValue: {
    color: colors.success,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: "600",
    color: colors.onBackground,
  },
  totalValue: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  policyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryFixed,
    padding: spacing.md,
    borderRadius: 12,
  },
  policyText: {
    fontSize: 11,
    color: colors.primary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: colors.secondary,
  },
  bottomTotalPrice: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: "700",
    color: colors.onBackground,
  },
  proceedBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: "600",
    color: colors.onPrimary,
    marginRight: 6,
  },
});

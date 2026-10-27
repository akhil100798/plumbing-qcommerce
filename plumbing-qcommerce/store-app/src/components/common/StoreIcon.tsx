import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';

// Import all local SVG icon assets
import AnalyticsIcon from '../../assets/icons/analytics.svg';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';
import BackIcon from '../../assets/icons/back.svg';
import BarcodeIcon from '../../assets/icons/barcode.svg';
import BrassValveIcon from '../../assets/icons/brass-valve.svg';
import CalendarIcon from '../../assets/icons/calendar.svg';
import CameraIcon from '../../assets/icons/camera.svg';
import ChatIcon from '../../assets/icons/chat.svg';
import CheckIcon from '../../assets/icons/check.svg';
import ChevronDownIcon from '../../assets/icons/chevron-down.svg';
import ChevronRightIcon from '../../assets/icons/chevron-right.svg';
import ClockIcon from '../../assets/icons/clock.svg';
import CloseIcon from '../../assets/icons/close.svg';
import CpvcPipeIcon from '../../assets/icons/cpvc-pipe.svg';
import DispatchIcon from '../../assets/icons/dispatch.svg';
import DownloadIcon from '../../assets/icons/download.svg';
import EditIcon from '../../assets/icons/edit.svg';
import EmptyStateIcon from '../../assets/icons/empty-state.svg';
import ErrorWarningIcon from '../../assets/icons/error-warning.svg';
import EyeIcon from '../../assets/icons/eye.svg';
import EyeOffIcon from '../../assets/icons/eye-off.svg';
import FilterIcon from '../../assets/icons/filter.svg';
import GoogleIcon from '../../assets/icons/google.svg';
import HomeIcon from '../../assets/icons/home.svg';
import InventoryIcon from '../../assets/icons/inventory.svg';
import LocationPinIcon from '../../assets/icons/location-pin.svg';
import LogoMarkIcon from '../../assets/icons/logo-mark.svg';
import LogoutIcon from '../../assets/icons/logout.svg';
import LowStockIcon from '../../assets/icons/low-stock.svg';
import MaterialRequestIcon from '../../assets/icons/material-request.svg';
import MessageIcon from '../../assets/icons/message.svg';
import MinusIcon from '../../assets/icons/minus.svg';
import MoreIcon from '../../assets/icons/more.svg';
import NotificationIcon from '../../assets/icons/notification.svg';
import OfferIcon from '../../assets/icons/offer.svg';
import OrderBoxIcon from '../../assets/icons/order-box.svg';
import OrderIcon from '../../assets/icons/order.svg';
import PackingIcon from '../../assets/icons/packing.svg';
import PhoneIcon from '../../assets/icons/phone.svg';
import PlumbingFittingIcon from '../../assets/icons/plumbing-fitting.svg';
import PlusIcon from '../../assets/icons/plus.svg';
import ProductAddIcon from '../../assets/icons/product-add.svg';
import ProfileIcon from '../../assets/icons/profile.svg';
import PromotionIcon from '../../assets/icons/promotion.svg';
import PvcElbowIcon from '../../assets/icons/pvc-elbow.svg';
import ReadyPickupIcon from '../../assets/icons/ready-pickup.svg';
import ReviewsIcon from '../../assets/icons/reviews.svg';
import RiderIcon from '../../assets/icons/rider.svg';
import RupeeIcon from '../../assets/icons/rupee.svg';
import SalesChartIcon from '../../assets/icons/sales-chart.svg';
import SearchIcon from '../../assets/icons/search.svg';
import SecurityIcon from '../../assets/icons/security.svg';
import SettingsIcon from '../../assets/icons/settings.svg';
import ShareIcon from '../../assets/icons/share.svg';
import ShieldVerifiedIcon from '../../assets/icons/shield-verified.svg';
import StarIcon from '../../assets/icons/star.svg';
import StockUpdateIcon from '../../assets/icons/stock-update.svg';
import StockIcon from '../../assets/icons/stock.svg';
import StoreProfileIcon from '../../assets/icons/store-profile.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import SupportIcon from '../../assets/icons/support.svg';
import ThreadTapeIcon from '../../assets/icons/thread-tape.svg';
import UploadIcon from '../../assets/icons/upload.svg';
import WalletPayoutIcon from '../../assets/icons/wallet-payout.svg';
import WalletIcon from '../../assets/icons/wallet.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import WrenchIcon from '../../assets/icons/wrench.svg';

export const ICON_REGISTRY: Record<string, React.FC<SvgProps>> = {
  // Navigation
  home: HomeIcon,
  orders: OrderIcon,
  order: OrderIcon,
  inventory: InventoryIcon,
  materials: MaterialRequestIcon,
  'material-requests': MaterialRequestIcon,
  account: ProfileIcon,
  profile: ProfileIcon,
  'drawer-menu': MoreIcon,

  // Actions
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  back: BackIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  close: CloseIcon,
  search: SearchIcon,
  filter: FilterIcon,
  edit: EditIcon,
  save: CheckIcon,
  share: ShareIcon,
  phone: PhoneIcon,
  notification: NotificationIcon,
  download: DownloadIcon,
  upload: UploadIcon,
  camera: CameraIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-right': ChevronRightIcon,
  eye: EyeIcon,
  'eye-off': EyeOffIcon,

  // Status
  success: SuccessCheckIcon,
  'success-check': SuccessCheckIcon,
  check: CheckIcon,
  warning: ErrorWarningIcon,
  'error-warning': ErrorWarningIcon,
  error: ErrorWarningIcon,
  pending: ClockIcon,
  clock: ClockIcon,
  calendar: CalendarIcon,
  processing: PackingIcon,
  'ready-for-pickup': ReadyPickupIcon,
  'ready-pickup': ReadyPickupIcon,
  collected: ShieldVerifiedIcon,
  'low-stock': LowStockIcon,
  verified: ShieldVerifiedIcon,
  'shield-verified': ShieldVerifiedIcon,
  star: StarIcon,

  // Business & Store operations
  store: StoreProfileIcon,
  'store-profile': StoreProfileIcon,
  warehouse: WarehouseIcon,
  package: OrderBoxIcon,
  'order-box': OrderBoxIcon,
  packing: PackingIcon,
  plumber: WrenchIcon,
  wrench: WrenchIcon,
  rupee: RupeeIcon,
  wallet: WalletIcon,
  payout: WalletPayoutIcon,
  'wallet-payout': WalletPayoutIcon,
  sales: SalesChartIcon,
  'sales-chart': SalesChartIcon,
  analytics: AnalyticsIcon,
  chart: SalesChartIcon,
  review: ReviewsIcon,
  reviews: ReviewsIcon,
  promotion: PromotionIcon,
  offer: OfferIcon,
  security: SecurityIcon,
  support: SupportIcon,
  settings: SettingsIcon,
  logout: LogoutIcon,
  'location-pin': LocationPinIcon,
  barcode: BarcodeIcon,
  chat: ChatIcon,
  message: MessageIcon,
  'empty-state': EmptyStateIcon,
  'stock-update': StockUpdateIcon,
  'product-add': ProductAddIcon,
  stock: StockIcon,
  google: GoogleIcon,
  'logo-mark': LogoMarkIcon,

  // Products
  'pvc-elbow': PvcElbowIcon,
  'cpvc-pipe': CpvcPipeIcon,
  'brass-valve': BrassValveIcon,
  'thread-tape': ThreadTapeIcon,
  'plumbing-fitting': PlumbingFittingIcon,
};

export type StoreIconName = keyof typeof ICON_REGISTRY;

export interface StoreIconProps {
  name: StoreIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function StoreIcon({
  name,
  size = 20,
  color = '#12141A',
  strokeWidth,
  accessibilityLabel,
  disabled = false,
  style,
}: StoreIconProps) {
  const IconComp = ICON_REGISTRY[name];

  if (!IconComp) {
    return null;
  }

  const effectiveColor = disabled ? '#9CA3AF' : color;

  return (
    <View
      style={[styles.container, { width: size, height: size, opacity: disabled ? 0.6 : 1 }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `${name} icon`}
    >
      <IconComp
        width={size}
        height={size}
        color={effectiveColor}
        stroke={effectiveColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StoreIcon;

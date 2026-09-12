import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';

export interface IconProps {
  size?: number;
  color?: string;
  fill?: string;
}

// ----------------------------------------------------
// BRAND ASSETS (MATCHING STITCH SOURCE OF TRUTH)
// ----------------------------------------------------
export const FixKartLogo: React.FC<{ size?: number; showText?: boolean; isWhite?: boolean }> = ({
  size = 36,
  showText = true,
  isWhite = false,
}) => {
  return (
    <Svg width={showText ? size * 4.2 : size} height={size} viewBox="0 0 160 40" fill="none">
      <Defs>
        <LinearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1a73e8" />
          <Stop offset="100%" stopColor="#005bbf" />
        </LinearGradient>
      </Defs>
      <Rect x="2" y="2" width="36" height="36" rx="10" fill="url(#logoGrad)" />
      <Path
        d="M20 11C16.686 11 14 13.686 14 17C14 18.257 14.388 19.423 15.05 20.386L10.707 24.707C10.316 25.098 10.316 25.732 10.707 26.123L13.877 29.293C14.268 29.684 14.902 29.684 15.293 29.293L19.614 24.95C20.577 25.612 21.743 26 23 26C26.314 26 29 23.314 29 20C29 18.743 28.612 17.577 27.95 16.614L24.5 20.064L20 15.564L23.386 12.05C22.423 11.388 21.257 11 20 11Z"
        fill="#ffffff"
      />
      {showText && (
        <G>
          <Path
            d="M50 14H62V17H53.5V21H60.5V24H53.5V29H50V14ZM65 14H68.5V29H65V14ZM72 14H76L79.5 20.5L83 14H87L81.8 21.5L87.5 29H83.2L80 23L76.5 29H72.5L78.2 21.5L72 14Z"
            fill={isWhite ? '#ffffff' : colors.onBackground}
          />
          <Path
            d="M93 14H96.5V20.2L102.2 14H106.8L100.5 20.8L107.2 29H102.4L96.5 22.2V29H93V14ZM113.5 14H117.8L123.5 29H119.8L118.5 25.8H112.8L111.5 29H107.8L113.5 14ZM117.4 22.8L115.6 18.2L113.8 22.8H117.4ZM125.5 14H133.5C136 14 138 15.8 138 18.2C138 19.8 137 21.2 135.5 22L138.8 29H134.8L132 22.8H129V29H125.5V14ZM129 17V20H133.2C134.2 20 135 19.2 135 18.5C135 17.8 134.2 17 133.2 17H129ZM140 14H154V17H148.8V29H145.2V17H140V14Z"
            fill={isWhite ? '#adc7ff' : colors.primary}
          />
        </G>
      )}
    </Svg>
  );
};

// ----------------------------------------------------
// NAVIGATION ICONS
// ----------------------------------------------------
export const HomeIcon: React.FC<IconProps> = ({ size = 24, color = colors.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = colors.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 20L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CartIcon: React.FC<IconProps> = ({ size = 24, color = colors.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 20C9.55228 20 10 19.5523 10 19C10 18.4477 9.55228 18 9 18C8.44772 18 8 18.4477 8 19C8 19.5523 8.44772 20 9 20Z" stroke={color} strokeWidth="2" />
    <Path d="M20 20C20.5523 20 21 19.5523 21 19C21 18.4477 20.5523 18 20 18C19.4477 18 19 18.4477 19 19C19 19.5523 19.4477 20 20 20Z" stroke={color} strokeWidth="2" />
    <Path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BookingsIcon: React.FC<IconProps> = ({ size = 24, color = colors.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <Path d="M16 2V6M8 2V6M3 10H21M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ size = 24, color = colors.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 21C20 17.134 16.4183 14 12 14C7.58172 14 4 17.134 4 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LocationPinIcon: React.FC<IconProps> = ({ size = 20, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="2" />
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 24, color = colors.onBackground }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ----------------------------------------------------
// CATEGORY ICONS
// ----------------------------------------------------
export const CategoryPipesIcon: React.FC<IconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 8H10V15H17V22H21V11H14V4H3V8Z" />
    <Circle cx="6.5" cy="6" r="1.5" />
    <Circle cx="17.5" cy="18" r="1.5" />
  </Svg>
);

export const CategoryFaucetsIcon: React.FC<IconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 3H15V6H9V3Z" />
    <Path d="M12 6V11H19C19.5523 11 20 11.4477 20 12V14H16V13H12V21H8V11H5V9H12" />
    <Path d="M18 17V19" strokeWidth="2.5" />
  </Svg>
);

export const CategorySanitaryIcon: React.FC<IconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 12H20V15C20 18.3137 17.3137 21 14 21H10C6.68629 21 4 18.3137 4 15V12Z" />
    <Path d="M6 12V5C6 3.89543 6.89543 3 8 3H16C17.1046 3 18 3.89543 18 5V12" />
    <Path d="M10 7H14" />
  </Svg>
);

export const CategoryValvesIcon: React.FC<IconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 6L12 12L4 18V6Z" />
    <Path d="M20 6L12 12L20 18V6Z" />
    <Path d="M12 4V12" strokeWidth="2.5" />
    <Rect x="9" y="2" width="6" height="3" rx="1.5" />
  </Svg>
);

export const CategoryTanksIcon: React.FC<IconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="5" y="6" width="14" height="15" rx="3" />
    <Path d="M8 3H16V6H8V3Z" />
    <Path d="M5 11H19M5 16H19" />
  </Svg>
);

export const CategoryDrainageIcon: React.FC<IconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Circle cx="12" cy="12" r="5" />
    <Path d="M12 3V21M3 12H21" />
  </Svg>
);

export const CategoryGeysersIcon: React.FC<IconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="6" y="3" width="12" height="18" rx="4" />
    <Circle cx="12" cy="9" r="2.5" fill={color} />
    <Path d="M12 14V17M10 16H14" />
  </Svg>
);

export const CategoryEmergencyIcon: React.FC<IconProps> = ({ size = 24, color = colors.tertiary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#ffdbcb" />
  </Svg>
);

export const WrenchIcon: React.FC<IconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14.7 6.3A5 5 0 0 0 7.7 13.3L1.5 19.5A2.12 2.12 0 0 0 4.5 22.5L10.7 16.3A5 5 0 0 0 17.7 9.3L14.7 6.3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ----------------------------------------------------
// ACTIONS & STATUS ICONS
// ----------------------------------------------------
export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 20, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const StarIcon: React.FC<{ size?: number; fill?: string; color?: string }> = ({
  size = 16,
  fill = colors.star,
  color = colors.star,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={fill} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 20, color = colors.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 20, color = colors.onBackground }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PhoneCallIcon: React.FC<IconProps> = ({ size = 20, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92V19.92C22 20.4727 21.5523 20.9205 20.9996 20.92C18.6675 20.8973 16.4258 20.1065 14.54 18.65C12.7844 17.3005 11.2995 15.8156 9.95 14.06C8.49352 12.1742 7.70273 9.93254 7.68 7.6004C7.67946 7.04768 8.12727 6.6 8.68 6.6H11.68C12.1764 6.6 12.5936 6.96355 12.66 7.456C12.7831 8.37525 13.0427 9.27139 13.43 10.11C13.5685 10.4074 13.4907 10.7628 13.24 10.98L11.97 12.25C13.2514 14.5028 15.0972 16.3486 17.35 17.63L18.62 16.36C18.8372 16.1093 19.1926 16.0315 19.49 16.17C20.3286 16.5573 21.2247 16.8169 22.144 16.94C22.6365 17.0064 23 17.4236 23 17.92V16.92Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 20, color = colors.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 18, color = colors.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 18, color = colors.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6H5H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11V17M14 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

import { TextStyle } from 'react-native';

export const fonts = {
  headline: 'Manrope',
  body: 'Inter',
  label: 'Inter',
  mono: 'JetBrains Mono',
} as const;

export interface TypographyTokens {
  display: TextStyle;
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  body: TextStyle;
  body2: TextStyle;
  caption: TextStyle;
  label: TextStyle;
  button: TextStyle;
  data: TextStyle;
}

export const typography: TypographyTokens = {
  display: {
    fontFamily: fonts.headline,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.75,
  },
  h1: {
    fontFamily: fonts.headline,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fonts.headline,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fonts.headline,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  h4: {
    fontFamily: fonts.headline,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  body2: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  label: {
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  button: {
    fontFamily: fonts.headline,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  data: {
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
};
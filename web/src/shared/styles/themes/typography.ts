import type { TextStyle } from 'react-native';

export const fonts = {
  // outfit: {
  //   thin: 'Outfit-Thin',
  //   extraLight: 'Outfit-ExtraLight',
  //   light: 'Outfit-Light',
  //   regular: 'Outfit-Regular',
  //   medium: 'Outfit-Medium',
  //   semiBold: 'Outfit-SemiBold',
  //   bold: 'Outfit-Bold',
  //   extraBold: 'Outfit-ExtraBold',
  //   black: 'Outfit-Black',
  // },
  fredoka: {
    regular: 'FredokaOne-Regular',
  },
  qualy: {
    regular: 'Qualy-neue-regular',
  },
} as const;

export type FontWeight = keyof typeof fonts.fredoka;

export const typography = {
  // Titres
  h1: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  } as TextStyle,

  h2: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
  } as TextStyle,

  h3: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  } as TextStyle,

  h4: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  } as TextStyle,

  h5: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  } as TextStyle,

  h6: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  } as TextStyle,

  // Texte du corps
  bodyLarge: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '400' as const,
    color: '#666666',
  } as TextStyle,

  body: {
    fontFamily: fonts.qualy.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    color: '#666666',
  } as TextStyle,

  bodySmall: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    color: '#666666',
  } as TextStyle,

  // Labels
  labelLarge: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
    color: '#666666',
  } as TextStyle,

  label: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    color: '#666666',
  } as TextStyle,

  labelSmall: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
    color: '#666666',
  } as TextStyle,

  labelExtraSmall: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
    color: '#666666',
  } as TextStyle,

  // Boutons
  button: {
    fontFamily: fonts.fredoka.regular,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  } as TextStyle,

  // Navigation
  navItem: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  } as TextStyle,

  navItemActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF8C00',
  } as TextStyle,

  // Points et badges
  points: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  } as TextStyle,

  badge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;

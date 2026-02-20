import { Platform } from 'react-native';

export const colors = {
  canvas: '#EEF2F7',
  canvasAlt: '#E4EBF5',
  surface: '#FFFFFF',
  surfaceSoft: '#F4F7FB',
  surfaceHighlight: '#E8F1FF',
  surfaceRaised: '#FAFCFF',

  textStrong: '#10233B',
  textBase: '#2A3E57',
  textMuted: '#62768E',
  textOnPrimary: '#F7FBFF',

  primary: '#145DA0',
  primaryLight: '#D8E9FF',
  primaryDark: '#0D3B66',

  secondary: '#1C8D73',
  secondaryLight: '#DCF7EF',

  accent: '#F4A259',
  accentLight: '#FFF1E2',

  info: '#2A6F97',
  infoLight: '#E1EDF6',

  danger: '#C44536',
  dangerLight: '#FFE8E5',

  success: '#2D936C',
  successLight: '#E4F5EF',

  warning: '#E09F3E',
  warningLight: '#FFF4DF',

  border: '#D5DFEC',
  borderLight: '#E8EEF6',
  borderStrong: '#BBC9DB',
  chip: '#EDF2F8',
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  display: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Bold', android: 'sans-serif-black' }),
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800' as const,
  },
  h1: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Bold', android: 'sans-serif-bold' }),
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  title: {
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  section: {
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Medium', android: 'sans-serif' }),
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  small: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#0D2038',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#0D2038',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0D2038',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
  card: {
    shadowColor: '#0D2038',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const layout = {
  screenHorizontalPadding: spacing.lg,
  screenBottomPadding: 120,
  maxContentWidth: 760,
};

import { Platform } from 'react-native';

export const colors = {
  canvas: '#F1F5F2',
  surface: '#FFFFFF',
  surfaceSoft: '#F8FAFA',
  surfaceHighlight: '#EBF5F1',
  textStrong: '#0F1F10',
  textBase: '#344E41',
  textMuted: '#6A8D73',
  primary: '#0B6E4F',
  primaryLight: '#D1E8E2',
  primaryDark: '#08543D',
  secondary: '#588157',
  accent: '#F4A261',
  info: '#2A6F97',
  infoLight: '#E1EBF2',
  danger: '#BC4749',
  dangerLight: '#FBE9E9',
  success: '#386641',
  successLight: '#E8F5E9',
  warning: '#F4A261',
  warningLight: '#FEF3E7',
  border: '#DDE5E0',
  borderLight: '#EDF2EF',
  chip: '#E6EFEA',
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
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
    fontWeight: '700',
  },
  h1: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Bold', android: 'sans-serif-bold' }),
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  title: {
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  section: {
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Medium', android: 'sans-serif' }),
    fontSize: 13,
    lineHeight: 18,
  },
  small: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
    fontSize: 11,
    lineHeight: 14,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
};

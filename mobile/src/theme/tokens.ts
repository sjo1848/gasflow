import { Platform } from 'react-native';

export const colors = {
  canvas: '#EEF4F1',
  surface: '#FFFFFF',
  surfaceSoft: '#F8FBFA',
  textStrong: '#132A13',
  textMuted: '#4B6253',
  primary: '#0B6E4F',
  primaryDark: '#09563E',
  accent: '#F4A261',
  info: '#2A6F97',
  danger: '#B42318',
  success: '#15803D',
  border: '#D7E3DC',
  chip: '#E6EFEA',
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

export const typography = {
  display: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Bold', android: 'sans-serif-black' }),
    fontSize: 32,
    lineHeight: 38,
  },
  title: {
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
    fontSize: 22,
    lineHeight: 28,
  },
  section: {
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
    fontSize: 12,
    lineHeight: 16,
  },
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
};

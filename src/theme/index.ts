import { Platform, TextStyle, ViewStyle } from 'react-native';

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const colors = {
  primary: '#E42D40',
  primaryDark: '#B82331',
  primarySoft: '#FDF3F4',
  primarySoft2: '#FBE1E4',
  secondary: '#007749',
  secondarySoft: '#E8F4EE',
  accent: '#FDB347',
  accentSoft: '#FFF4E0',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceAlt: '#F1F3F5',
  surfaceRaised: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  textOnAccent: '#1A1A2E',
  text: '#1A1A2E',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  destructive: '#DC2626',
  destructiveSoft: '#FEF2F2',
  success: '#007749',
  successSoft: '#E8F4EE',
  warning: '#F59E0B',
  warningSoft: '#FFF8EB',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
  navy: '#1A1F2C',
  navySoft: '#242B3D',
  secondaryLight: '#2FBF71',
  overlay: 'rgba(26, 26, 46, 0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  pill: 999,
  sheet: 20,
} as const;

const type = (size: number, lineHeight: number, family: keyof typeof font): TextStyle => ({
  fontFamily: font[family],
  fontSize: size,
  lineHeight,
});

export const typography = {
  display: type(32, 40, 'extrabold'),
  h1: type(26, 34, 'bold'),
  h2: type(21, 28, 'bold'),
  h3: type(17, 24, 'semibold'),
  body: type(15, 22, 'regular'),
  bodyStrong: type(15, 22, 'semibold'),
  caption: type(13, 18, 'regular'),
  captionStrong: type(13, 18, 'semibold'),
  micro: type(11, 14, 'medium'),
} as const;

type ShadowPreset = { shadow: ViewStyle; elevation: number };

const makeShadow = (elevation: number, opacity: number, y: number, blur: number): ShadowPreset => ({
  elevation,
  shadow:
    Platform.OS === 'ios'
      ? { shadowColor: '#1A1A2E', shadowOpacity: opacity, shadowOffset: { width: 0, height: y }, shadowRadius: blur }
      : {},
});

export const elevation = {
  none: makeShadow(0, 0, 0, 0),
  xs: makeShadow(1, 0.05, 1, 2),
  sm: makeShadow(2, 0.07, 2, 6),
  md: makeShadow(4, 0.1, 4, 12),
  lg: makeShadow(8, 0.12, 8, 20),
} as const;

export const shadows = {
  card: { ...elevation.sm.shadow, elevation: elevation.sm.elevation } as ViewStyle,
  raised: { ...elevation.md.shadow, elevation: elevation.md.elevation } as ViewStyle,
} as const;

export const motion = {
  fast: 140,
  normal: 220,
  slow: 340,
  spring: { damping: 18, stiffness: 220, mass: 0.7 },
  springGentle: { damping: 20, stiffness: 160, mass: 0.9 },
} as const;

export const layout = {
  screenMargin: 16,
  cardRadius: 14,
  inputHeight: 50,
  buttonHeight: 52,
  hitSlop: 44,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  elevation,
  shadows,
  motion,
  layout,
} as const;

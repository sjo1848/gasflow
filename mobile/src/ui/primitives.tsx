import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';
import { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const isTestEnv = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type BackdropTone = 'light' | 'intermediate' | 'dark';

const backdropPalette: Record<
  BackdropTone,
  {
    base: string;
    blobA: string;
    blobB: string;
    blobC: string;
    ribbon: string;
    ribbonBorder: string;
    blobOpacity: number;
    ribbonOpacity: number;
  }
> = {
  light: {
    base: colors.canvas,
    blobA: colors.primaryLight,
    blobB: colors.secondaryLight,
    blobC: colors.accentLight,
    ribbon: colors.surface,
    ribbonBorder: colors.borderLight,
    blobOpacity: 0.55,
    ribbonOpacity: 0.4,
  },
  intermediate: {
    base: '#DCE6F3',
    blobA: '#8CB9E3',
    blobB: '#85D2BF',
    blobC: '#F4C28D',
    ribbon: '#F4F8FF',
    ribbonBorder: '#B6CAE5',
    blobOpacity: 0.52,
    ribbonOpacity: 0.48,
  },
  dark: {
    base: '#0D1A2B',
    blobA: '#1E5FA3',
    blobB: '#20856E',
    blobC: '#BD7B35',
    ribbon: '#132238',
    ribbonBorder: '#2D4261',
    blobOpacity: 0.42,
    ribbonOpacity: 0.5,
  },
};

interface AppButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: ButtonTone;
  icon?: LucideIcon;
  style?: ViewStyle;
  haptic?: Haptics.ImpactFeedbackStyle | 'success' | 'warning' | 'error';
}

function triggerHaptic(haptic: AppButtonProps['haptic']): void {
  if (!haptic) return;

  try {
    if (haptic === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (haptic === 'warning') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (haptic === 'error') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    void Haptics.impactAsync(haptic);
  } catch {
    // No bloqueamos la acción por fallas del motor háptico.
  }
}

export function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  tone = 'primary',
  icon: Icon,
  style,
  haptic = Haptics.ImpactFeedbackStyle.Light,
}: AppButtonProps): React.JSX.Element {
  const handlePress = () => {
    triggerHaptic(haptic);
    onPress();
  };

  const getStyles = () => {
    switch (tone) {
      case 'primary':
        return styles.btnPrimary;
      case 'secondary':
        return styles.btnSecondary;
      case 'danger':
        return styles.btnDanger;
      case 'ghost':
        return styles.btnGhost;
      case 'outline':
        return styles.btnOutline;
      default:
        return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    if (tone === 'ghost' || tone === 'outline') return styles.btnTextGhost;
    return styles.btnText;
  };

  const getSpinnerColor = () => {
    if (tone === 'ghost' || tone === 'outline') return colors.primary;
    return colors.textOnPrimary;
  };

  const getIconColor = () => {
    if (tone === 'ghost' || tone === 'outline') return colors.primary;
    return colors.textOnPrimary;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btnBase,
        getStyles(),
        pressed && !disabled && !loading ? styles.btnPressed : null,
        disabled || loading ? styles.btnDisabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getSpinnerColor()} size="small" />
      ) : (
        <View style={styles.btnContent}>
          {Icon ? <Icon size={18} color={getIconColor()} strokeWidth={2.4} style={styles.btnIcon} /> : null}
          <Text style={[getTextStyle(), disabled ? styles.btnTextDisabled : null]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Skeleton({
  width,
  height,
  borderRadius = radii.sm,
  style,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    if (isTestEnv) {
      opacity.setValue(0.28);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.62,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 760,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface AppInputProps extends TextInputProps {
  label?: string;
  testID?: string;
  icon?: LucideIcon;
}

export function AppInput({
  label,
  style,
  testID,
  icon: Icon,
  multiline,
  secureTextEntry,
  ...props
}: AppInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const isMultiline = !!multiline;
  const isSecure = !!secureTextEntry;

  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.inputFocused : null,
          isMultiline ? styles.inputMultilineContainer : null,
        ]}
      >
        {Icon ? <Icon size={18} color={isFocused ? colors.primary : colors.textMuted} style={styles.inputIcon} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, isMultiline ? styles.inputMultiline : null, style]}
          testID={testID}
          multiline={isMultiline}
          secureTextEntry={isSecure}
          underlineColorAndroid="transparent"
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
          {...props}
        />
      </View>
    </View>
  );
}

export function Card({ style, ...props }: ViewProps): React.JSX.Element {
  return <View style={[styles.card, style]} {...props} />;
}

interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'success' | 'danger' | 'info' | 'warning';
  size?: 'sm' | 'md';
}

export function Badge({ label, tone = 'neutral', size = 'md' }: BadgeProps): React.JSX.Element {
  const toneStyle = () => {
    switch (tone) {
      case 'success':
        return styles.badgeSuccess;
      case 'danger':
        return styles.badgeDanger;
      case 'info':
        return styles.badgeInfo;
      case 'warning':
        return styles.badgeWarning;
      default:
        return styles.badgeNeutral;
    }
  };

  const textStyle = () => {
    switch (tone) {
      case 'success':
        return { color: colors.success };
      case 'danger':
        return { color: colors.danger };
      case 'info':
        return { color: colors.info };
      case 'warning':
        return { color: colors.warning };
      default:
        return { color: colors.textBase };
    }
  };

  return (
    <View style={[styles.badge, toneStyle(), size === 'sm' ? styles.badgeSm : null]}>
      <Text style={[styles.badgeText, textStyle(), size === 'sm' ? styles.badgeTextSm : null]}>{label}</Text>
    </View>
  );
}

export const Chip = ({ label, tone }: { label: string; tone?: BadgeProps['tone'] }) => (
  <Badge label={label} tone={tone} />
);

export function ScreenBackdrop({ tone = 'light' }: { tone?: BackdropTone }): React.JSX.Element {
  const palette = backdropPalette[tone];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.backdropBase, { backgroundColor: palette.base }]} />
      <View style={[styles.blobA, { backgroundColor: palette.blobA, opacity: palette.blobOpacity }]} />
      <View style={[styles.blobB, { backgroundColor: palette.blobB, opacity: palette.blobOpacity }]} />
      <View style={[styles.blobC, { backgroundColor: palette.blobC, opacity: palette.blobOpacity + 0.08 }]} />
      <View
        style={[
          styles.ribbon,
          {
            backgroundColor: palette.ribbon,
            borderColor: palette.ribbonBorder,
            opacity: palette.ribbonOpacity,
          },
        ]}
      />
    </View>
  );
}

interface InlineMessageProps {
  tone?: 'info' | 'success' | 'warning' | 'error';
  text: string;
  icon?: LucideIcon;
}

export function InlineMessage({
  tone = 'info',
  text,
  icon: Icon,
}: InlineMessageProps): React.JSX.Element {
  const getToneStyles = () => {
    switch (tone) {
      case 'success':
        return styles.msgSuccess;
      case 'warning':
        return styles.msgWarning;
      case 'error':
        return styles.msgError;
      default:
        return styles.msgInfo;
    }
  };

  const getIconColor = () => {
    switch (tone) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.danger;
      default:
        return colors.info;
    }
  };

  return (
    <View style={[styles.msgBase, getToneStyles()]}>
      <View style={styles.msgContent}>
        {Icon ? <Icon size={16} color={getIconColor()} style={styles.msgIcon} /> : null}
        <Text style={[styles.msgText, { color: getIconColor() }]}>{text}</Text>
      </View>
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.emptyWrap}>
      {Icon ? <Icon size={46} color={colors.borderStrong} style={styles.emptyIcon} /> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

interface LoadingBlockProps {
  label?: string;
}

export function LoadingBlock({ label = 'Cargando...' }: LoadingBlockProps): React.JSX.Element {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={colors.primary} size="small" />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btnBase: {
    minHeight: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: spacing.xs,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  btnDanger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  btnOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderColor: 'transparent',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: colors.textOnPrimary,
    ...typography.section,
    fontSize: 15,
  },
  btnTextGhost: {
    color: colors.primary,
    ...typography.section,
    fontSize: 15,
  },
  btnTextDisabled: {
    color: colors.textOnPrimary,
  },

  inputWrap: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textBase,
    fontWeight: '700',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceRaised,
  },
  inputMultilineContainer: {
    minHeight: 104,
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  inputIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  input: {
    flex: 1,
    color: colors.textStrong,
    ...typography.body,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    ...shadows.card,
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgeNeutral: {
    backgroundColor: colors.chip,
    borderColor: colors.border,
  },
  badgeSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  badgeDanger: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  badgeInfo: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
  },
  badgeWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  badgeText: {
    ...typography.small,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeTextSm: {
    fontSize: 10,
  },

  backdropBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.canvas,
  },
  blobA: {
    position: 'absolute',
    top: -130,
    right: -70,
    width: 290,
    height: 290,
    borderRadius: 145,
  },
  blobB: {
    position: 'absolute',
    top: 170,
    left: -140,
    width: 270,
    height: 270,
    borderRadius: 135,
  },
  blobC: {
    position: 'absolute',
    bottom: -170,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  ribbon: {
    position: 'absolute',
    top: 110,
    right: -35,
    width: 240,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    transform: [{ rotate: '-14deg' }],
  },

  msgBase: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  msgContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  msgIcon: {
    marginRight: spacing.sm,
  },
  msgInfo: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
  },
  msgSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  msgWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  msgError: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  msgText: {
    ...typography.caption,
    fontWeight: '700',
    flex: 1,
  },

  emptyWrap: {
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyIcon: {
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.section,
    color: colors.textStrong,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },

  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

import React, { useEffect, useRef } from 'react';
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

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

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
    if (haptic === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (haptic === 'warning') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (haptic === 'error') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      void Haptics.impactAsync(haptic as Haptics.ImpactFeedbackStyle);
    }
    onPress();
  };

  const getStyles = () => {
    switch (tone) {
      case 'primary': return styles.btnPrimary;
      case 'secondary': return styles.btnSecondary;
      case 'danger': return styles.btnDanger;
      case 'ghost': return styles.btnGhost;
      case 'outline': return styles.btnOutline;
      default: return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    if (tone === 'ghost' || tone === 'outline') return styles.btnTextGhost;
    return styles.btnText;
  };

  const getSpinnerColor = () => {
    if (tone === 'ghost' || tone === 'outline') return colors.primary;
    return '#FFFFFF';
  };

  const getIconColor = () => {
    if (tone === 'ghost' || tone === 'outline') return colors.primary;
    if (tone === 'danger') return '#FFFFFF';
    return '#FFFFFF';
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
          {Icon && <Icon size={18} color={getIconColor()} strokeWidth={2.5} style={{ marginRight: 8 }} />}
          <Text style={[getTextStyle(), disabled ? styles.btnTextDisabled : null]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Skeleton({ width, height, borderRadius = radii.sm, style }: { width?: any, height?: any, borderRadius?: number, style?: ViewStyle }): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
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

export function AppInput({ label, style, testID, icon: Icon, ...props }: AppInputProps): React.JSX.Element {
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputContainer, props.multiline ? { height: 100, alignItems: 'flex-start', paddingTop: 10 } : null]}>
        {Icon && <Icon size={18} color={colors.textMuted} style={{ marginRight: 10 }} />}
        <TextInput
          placeholderTextColor="#94A3B8"
          style={[styles.input, style]}
          testID={testID}
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
      case 'success': return styles.badgeSuccess;
      case 'danger': return styles.badgeDanger;
      case 'info': return styles.badgeInfo;
      case 'warning': return styles.badgeWarning;
      default: return styles.badgeNeutral;
    }
  };

  const textStyle = () => {
    switch (tone) {
      case 'success': return { color: colors.success };
      case 'danger': return { color: colors.danger };
      case 'info': return { color: colors.info };
      case 'warning': return { color: colors.warning };
      default: return { color: colors.textBase };
    }
  };

  return (
    <View style={[styles.badge, toneStyle(), size === 'sm' ? styles.badgeSm : null]}>
      <Text style={[styles.badgeText, textStyle(), size === 'sm' ? { fontSize: 10 } : null]}>{label}</Text>
    </View>
  );
}

// Backward compatibility
export const Chip = ({ label, tone }: { label: string, tone?: any }) => <Badge label={label} tone={tone} />;

export function ScreenBackdrop(): React.JSX.Element {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.blobA} />
      <View style={styles.blobB} />
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
      case 'success': return styles.msgSuccess;
      case 'warning': return styles.msgWarning;
      case 'error': return styles.msgError;
      default: return styles.msgInfo;
    }
  };

  const getIconColor = () => {
    switch (tone) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.danger;
      default: return colors.info;
    }
  };

  return (
    <View style={[styles.msgBase, getToneStyles()]}>
      <View style={styles.msgContent}>
        {Icon && <Icon size={16} color={getIconColor()} style={{ marginRight: 8 }} />}
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
      {Icon && <Icon size={48} color={colors.border} style={{ marginBottom: spacing.md }} />}
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
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#FFFFFF',
    ...typography.section,
    fontSize: 16,
  },
  btnTextGhost: {
    color: colors.primary,
    ...typography.section,
    fontSize: 16,
  },
  btnTextDisabled: {
    color: '#FFFFFF',
  },
  inputWrap: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textBase,
    fontWeight: '600',
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
  input: {
    flex: 1,
    color: colors.textStrong,
    ...typography.body,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    ...shadows.md,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeNeutral: {
    backgroundColor: colors.borderLight,
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  blobA: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryLight,
    opacity: 0.3,
  },
  blobB: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.warningLight,
    opacity: 0.3,
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
    fontWeight: '600',
    flex: 1,
  },
  emptyWrap: {
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
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

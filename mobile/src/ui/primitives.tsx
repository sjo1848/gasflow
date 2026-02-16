import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: ButtonTone;
}

export function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  tone = 'primary',
}: AppButtonProps): React.JSX.Element {
  const toneStyle =
    tone === 'primary'
      ? styles.btnPrimary
      : tone === 'secondary'
        ? styles.btnSecondary
        : tone === 'danger'
          ? styles.btnDanger
          : styles.btnGhost;

  const textStyle = tone === 'ghost' ? styles.btnTextGhost : styles.btnText;
  const spinnerColor = tone === 'ghost' ? colors.textStrong : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btnBase,
        toneStyle,
        pressed && !disabled && !loading ? styles.btnPressed : null,
        disabled || loading ? styles.btnDisabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text style={[textStyle, disabled ? styles.btnTextDisabled : null]}>{title}</Text>
      )}
    </Pressable>
  );
}

interface AppInputProps extends TextInputProps {
  label?: string;
  testID?: string;
}

export function AppInput({ label, style, testID, ...props }: AppInputProps): React.JSX.Element {
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#7A8D83"
        style={[styles.input, style]}
        testID={testID}
        {...props}
      />
    </View>
  );
}

export function Card({ style, ...props }: ViewProps): React.JSX.Element {
  return <View style={[styles.card, style]} {...props} />;
}

interface ChipProps {
  label: string;
  tone?: 'neutral' | 'success' | 'danger' | 'info' | 'warning';
}

export function Chip({ label, tone = 'neutral' }: ChipProps): React.JSX.Element {
  const toneStyle =
    tone === 'success'
      ? styles.chipSuccess
      : tone === 'danger'
        ? styles.chipDanger
        : tone === 'info'
          ? styles.chipInfo
          : tone === 'warning'
            ? styles.chipWarning
            : styles.chipNeutral;

  return (
    <View style={[styles.chip, toneStyle]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function ScreenBackdrop(): React.JSX.Element {
  return (
    <>
      <View style={styles.blobA} />
      <View style={styles.blobB} />
    </>
  );
}

interface InlineMessageProps {
  tone?: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

export function InlineMessage({
  tone = 'info',
  text,
}: InlineMessageProps): React.JSX.Element {
  const toneStyle =
    tone === 'success'
      ? styles.msgSuccess
      : tone === 'warning'
        ? styles.msgWarning
        : tone === 'error'
          ? styles.msgError
          : styles.msgInfo;

  return (
    <View style={[styles.msgBase, toneStyle]}>
      <Text style={styles.msgText}>{text}</Text>
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.emptyWrap}>
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
    minHeight: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.textStrong,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    color: '#FFFFFF',
    ...typography.section,
    fontSize: 15,
  },
  btnTextGhost: {
    color: colors.textStrong,
    ...typography.section,
    fontSize: 15,
  },
  btnTextDisabled: {
    color: '#E5E7EB',
  },
  inputWrap: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.textStrong,
    ...typography.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  chipNeutral: {
    backgroundColor: '#EDF3EF',
    borderColor: '#D7E3DC',
  },
  chipSuccess: {
    backgroundColor: '#E8F8EE',
    borderColor: '#9AD9B0',
  },
  chipDanger: {
    backgroundColor: '#FDECEC',
    borderColor: '#F5A3A3',
  },
  chipInfo: {
    backgroundColor: '#EAF3FA',
    borderColor: '#9BC7E3',
  },
  chipWarning: {
    backgroundColor: '#FFF3E3',
    borderColor: '#F4C389',
  },
  chipText: {
    ...typography.caption,
    color: colors.textStrong,
  },
  blobA: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#CDEFE3',
    opacity: 0.5,
  },
  blobB: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FBE5C8',
    opacity: 0.45,
  },
  msgBase: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  msgInfo: {
    backgroundColor: '#EAF3FA',
    borderColor: '#9BC7E3',
  },
  msgSuccess: {
    backgroundColor: '#E8F8EE',
    borderColor: '#9AD9B0',
  },
  msgWarning: {
    backgroundColor: '#FFF3E3',
    borderColor: '#F4C389',
  },
  msgError: {
    backgroundColor: '#FDECEC',
    borderColor: '#F5A3A3',
  },
  msgText: {
    ...typography.caption,
    color: colors.textStrong,
  },
  emptyWrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingVertical: spacing.lg,
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
    paddingVertical: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

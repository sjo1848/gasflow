import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiBaseUrl } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, InlineMessage, ScreenBackdrop } from '../ui/primitives';
import { Flame, Lock, LogIn, User } from 'lucide-react-native';

type DemoUser = {
  label: string;
  username: string;
  password: string;
};

const demoUsers: DemoUser[] = [
  { label: 'Admin Demo', username: 'admin', password: 'admin123' },
  { label: 'Repartidor Demo', username: 'repartidor', password: 'repartidor123' },
];

export function LoginScreen(): React.JSX.Element {
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await login(username.trim(), password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScreenBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboard, topInset > 0 ? { paddingTop: topInset } : null]}
      >
        <View style={styles.hero}>
          <View style={styles.brandBadge}>
            <Text style={styles.badgeText}>OPERACION GLP</Text>
          </View>
          <View style={styles.iconCircle}>
            <Flame color={colors.primary} size={38} strokeWidth={2.4} />
          </View>
          <Text style={styles.brand}>GasFlow</Text>
          <Text style={styles.tagline}>Despacho y reparto con foco en operación diaria.</Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.header}>
            <Text style={styles.formTitle}>Bienvenido</Text>
            <Text style={styles.formHint}>Ingresá tus credenciales para continuar</Text>
          </View>

          <AppInput
            label="Usuario"
            placeholder="admin"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            icon={User}
          />
          <AppInput
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={Lock}
          />

          <View style={styles.demoRow}>
            {demoUsers.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setUsername(item.username);
                  setPassword(item.password);
                }}
                style={({ pressed }) => [styles.demoChip, pressed ? styles.demoChipPressed : null]}
              >
                <Text style={styles.demoText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <InlineMessage tone="error" text={error} /> : null}

          <AppButton
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
            icon={LogIn}
            haptic="success"
            style={{ marginTop: spacing.xs }}
          />

          <View style={styles.footerInfo}>
            <Text style={styles.footnote}>Admin: admin/admin123</Text>
            <Text style={styles.footnote}>Repartidor: repartidor/repartidor123</Text>
            <Text style={styles.apiHint}>API: {getApiBaseUrl()}</Text>
          </View>
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  brandBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  brand: {
    ...typography.display,
    color: colors.textStrong,
    letterSpacing: -0.6,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  formCard: {
    borderRadius: radii.xl,
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  header: {
    marginBottom: spacing.xs,
  },
  formTitle: {
    ...typography.h1,
    color: colors.textStrong,
  },
  formHint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  demoRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  demoChip: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoChipPressed: {
    opacity: 0.72,
  },
  demoText: {
    ...typography.small,
    color: colors.textBase,
    fontWeight: '700',
  },
  footerInfo: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    gap: 2,
  },
  footnote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  apiHint: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
});

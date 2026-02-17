import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getApiBaseUrl } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { colors, radii, spacing, typography, shadows } from '../theme/tokens';
import { AppButton, AppInput, Card, InlineMessage, ScreenBackdrop } from '../ui/primitives';
import { LogIn, User, Lock, Flame } from 'lucide-react-native';

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
          <View style={styles.iconCircle}>
            <Flame color={colors.primary} size={40} strokeWidth={2.5} />
          </View>
          <Text style={styles.brand}>GasFlow</Text>
          <Text style={styles.tagline}>Gestión profesional de energía y logística.</Text>
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

          {error ? <InlineMessage tone="error" text={error} /> : null}

          <AppButton 
            title="Iniciar Sesión" 
            onPress={handleLogin} 
            loading={loading} 
            icon={LogIn}
            haptic="success"
            style={{ marginTop: spacing.sm }}
          />

          <View style={styles.divider} />
          
          <Text style={styles.footnote}>
            Admin: admin/admin123 {"\n"}
            Repartidor: repartidor/repartidor123
          </Text>
          <View style={styles.apiBox}>
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
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  brand: {
    ...typography.display,
    color: colors.textStrong,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  formCard: {
    borderRadius: radii.xl,
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  header: {
    marginBottom: spacing.sm,
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
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  footnote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  apiBox: {
    backgroundColor: colors.surfaceSoft,
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  apiHint: {
    ...typography.small,
    color: colors.textMuted,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
});

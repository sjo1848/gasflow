import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, ScreenBackdrop } from '../ui/primitives';

interface Props {
  onSubmit: (username: string, password: string) => Promise<void>;
}

export function LoginScreen({ onSubmit }: Props): React.JSX.Element {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(username.trim(), password);
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
          <Text style={styles.brand}>GasFlow</Text>
          <Text style={styles.tagline}>Operación profesional de reparto, sin fricción.</Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Ingresar</Text>
          <Text style={styles.formHint}>Usá credenciales de Admin o Repartidor.</Text>

          <AppInput
            label="Usuario"
            placeholder="admin"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <AppInput
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Validando acceso...</Text>
            </View>
          ) : (
            <AppButton title="Entrar al sistema" onPress={handleLogin} />
          )}

          <Text style={styles.footnote}>Admin: admin/admin123 • Repartidor: repartidor/repartidor123</Text>
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
    gap: spacing.md,
  },
  hero: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  brand: {
    ...typography.display,
    color: colors.textStrong,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    maxWidth: 280,
  },
  formCard: {
    borderRadius: radii.xl,
    gap: spacing.md,
    padding: spacing.lg,
  },
  formTitle: {
    ...typography.title,
    color: colors.textStrong,
  },
  formHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -4,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  footnote: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

import React from 'react';
import { Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Role } from '../types';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { AppMode, availableModes } from '../utils/mode';
import { AppButton, Card, ScreenBackdrop } from '../ui/primitives';

interface Props {
  role: Role;
  username: string;
  onSelectMode: (mode: AppMode) => void;
  onLogout: () => void;
}

export function ModeSelectScreen({
  role,
  username,
  onSelectMode,
  onLogout,
}: Props): React.JSX.Element {
  const modes = availableModes(role);
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScreenBackdrop />
      <View style={[styles.content, topInset > 0 ? { paddingTop: spacing.xl + topInset } : null]}>
        <Text style={styles.title}>Elegí modo de trabajo</Text>
        <Text style={styles.subtitle}>
          {username} • {role}
        </Text>

        <View style={styles.modeGrid}>
          {modes.map((mode) => (
            <Pressable
              key={mode}
              onPress={() => onSelectMode(mode)}
              style={({ pressed }) => [styles.modeCard, pressed ? styles.modeCardPressed : null]}
            >
              <Card style={styles.modeInner}>
                <Text style={styles.modeEmoji}>{mode === 'ADMIN' ? '🧭' : '🚚'}</Text>
                <Text style={styles.modeTitle}>{mode === 'ADMIN' ? 'Panel Admin' : 'Panel Repartidor'}</Text>
                <Text style={styles.modeText}>
                  {mode === 'ADMIN'
                    ? 'Crear pedidos, asignar rutas y controlar stock.'
                    : 'Ver asignaciones y registrar entregas en campo.'}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <AppButton title="Cerrar sesión" tone="danger" onPress={onLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.textStrong,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  modeGrid: {
    gap: spacing.md,
  },
  modeCard: {
    borderRadius: radii.lg,
  },
  modeCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  modeInner: {
    borderRadius: radii.lg,
    gap: spacing.xs,
    minHeight: 132,
  },
  modeEmoji: {
    fontSize: 22,
  },
  modeTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
  modeText: {
    ...typography.body,
    color: colors.textMuted,
  },
});

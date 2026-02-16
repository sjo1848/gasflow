import React from 'react';
import { Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Role } from '../types';
import { colors, radii, spacing, typography, shadows } from '../theme/tokens';
import { AppMode, availableModes } from '../utils/mode';
import { AppButton, Card, ScreenBackdrop } from '../ui/primitives';
import { ShieldCheck, Truck, LogOut, ChevronRight } from 'lucide-react-native';

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
        <View style={styles.header}>
          <Text style={styles.title}>Elegí modo de trabajo</Text>
          <View style={styles.userBadge}>
            <Text style={styles.subtitle}>
              {username} • {role}
            </Text>
          </View>
        </View>

        <View style={styles.modeGrid}>
          {modes.map((mode) => {
            const isAdmin = mode === 'ADMIN';
            const Icon = isAdmin ? ShieldCheck : Truck;
            
            return (
              <Pressable
                key={mode}
                onPress={() => onSelectMode(mode)}
                style={({ pressed }) => [styles.modeCard, pressed ? styles.modeCardPressed : null]}
              >
                <Card style={styles.modeInner}>
                  <View style={[styles.iconBox, { backgroundColor: isAdmin ? colors.primaryLight : colors.warningLight }]}>
                    <Icon color={isAdmin ? colors.primary : colors.warning} size={28} strokeWidth={2.5} />
                  </View>
                  <View style={styles.modeContent}>
                    <Text style={styles.modeTitle}>{isAdmin ? 'Panel Admin' : 'Panel Repartidor'}</Text>
                    <Text style={styles.modeText}>
                      {isAdmin
                        ? 'Crear pedidos, asignar rutas y controlar stock.'
                        : 'Ver asignaciones y registrar entregas en campo.'}
                    </Text>
                  </View>
                  <ChevronRight color={colors.border} size={20} />
                </Card>
              </Pressable>
            );
          })}
        </View>

        <AppButton 
          title="Cerrar sesión" 
          tone="outline" 
          onPress={onLogout} 
          icon={LogOut}
          style={{ borderColor: colors.danger, marginTop: spacing.lg }}
        />
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textStrong,
    marginBottom: 8,
  },
  userBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceHighlight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  subtitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modeGrid: {
    gap: spacing.md,
  },
  modeCard: {
    borderRadius: radii.lg,
  },
  modeCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
  modeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 100,
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeContent: {
    flex: 1,
    gap: 2,
  },
  modeTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
  modeText: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

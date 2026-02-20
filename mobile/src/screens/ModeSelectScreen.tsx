import React from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Role } from '../types';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';
import { AppMode, availableModes } from '../utils/mode';
import { AppButton, Card, ScreenBackdrop } from '../ui/primitives';
import { ChevronRight, LogOut, ShieldCheck, Truck } from 'lucide-react-native';

interface Props {
  role: Role;
  username: string;
  onSelectMode: (mode: AppMode) => void;
  onLogout: () => void;
}

export function ModeSelectScreen({ role, username, onSelectMode, onLogout }: Props): React.JSX.Element {
  const modes = availableModes(role);
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScreenBackdrop />
      <View style={[styles.content, topInset > 0 ? { paddingTop: spacing.xl + topInset } : null]}>
        <View style={styles.header}>
          <Text style={styles.title}>Elegí modo de trabajo</Text>
          <Text style={styles.helper}>Podés cambiar este modo en cualquier momento.</Text>
          <View style={styles.userBadge}>
            <Text style={styles.subtitle}>{username} • {role}</Text>
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
                  <View style={[styles.colorStrip, { backgroundColor: isAdmin ? colors.primary : colors.secondary }]} />
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: isAdmin ? colors.primaryLight : colors.secondaryLight },
                    ]}
                  >
                    <Icon color={isAdmin ? colors.primary : colors.secondary} size={26} strokeWidth={2.4} />
                  </View>
                  <View style={styles.modeContent}>
                    <Text style={styles.modeTitle}>{isAdmin ? 'Panel Admin' : 'Panel Repartidor'}</Text>
                    <Text style={styles.modeText}>
                      {isAdmin
                        ? 'Crear pedidos, asignar rutas y controlar stock diario.'
                        : 'Ver asignaciones, navegar domicilios y registrar entregas.'}
                    </Text>
                  </View>
                  <ChevronRight color={colors.borderStrong} size={20} />
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
          style={styles.logoutBtn}
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
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textStrong,
  },
  helper: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  userBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    marginTop: spacing.sm,
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
    paddingLeft: spacing.sm,
    gap: spacing.md,
    minHeight: 104,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  colorStrip: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: radii.full,
  },
  iconBox: {
    width: 54,
    height: 54,
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
  logoutBtn: {
    borderColor: colors.danger,
    marginTop: spacing.md,
  },
});

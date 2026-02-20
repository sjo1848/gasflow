import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useSyncQueue } from './src/hooks/useSyncQueue';
import { colors, radii, shadows, spacing, typography } from './src/theme/tokens';
import { ScreenBackdrop } from './src/ui/primitives';

const isTestEnv = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: isTestEnv ? false : 2,
      staleTime: isTestEnv ? 0 : 1000 * 60 * 5,
      gcTime: isTestEnv ? Infinity : 1000 * 60 * 5,
    },
  },
});

export default function App(): React.JSX.Element {
  useSyncQueue();
  const { status, bootstrap } = useAuthStore();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={styles.loaderWrap}>
        <StatusBar barStyle="dark-content" />
        <ScreenBackdrop />
        <View style={styles.loaderCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loaderTitle}>GasFlow</Text>
          <Text style={styles.loaderText}>Cargando sesión...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loaderCard: {
    minWidth: 220,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  loaderTitle: {
    ...typography.title,
    color: colors.textStrong,
    marginTop: spacing.sm,
  },
  loaderText: {
    ...typography.body,
    color: colors.textMuted,
  },
});

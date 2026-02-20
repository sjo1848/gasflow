import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDarkScheme = colorScheme === 'dark';
  const loaderTone = isDarkScheme ? 'dark' : 'intermediate';
  const loaderPalette = isDarkScheme
    ? {
        cardBg: '#132238',
        cardBorder: '#2D4261',
        title: '#E9F2FF',
        text: '#A9BED8',
        spinner: '#72B6FF',
        statusBar: 'light-content' as const,
      }
    : {
        cardBg: '#F4F8FF',
        cardBorder: '#B6CAE5',
        title: '#10233B',
        text: '#445A76',
        spinner: colors.primary,
        statusBar: 'dark-content' as const,
      };

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={styles.loaderWrap}>
        <StatusBar barStyle={loaderPalette.statusBar} />
        <ScreenBackdrop tone={loaderTone} />
        <View style={[styles.loaderCard, { backgroundColor: loaderPalette.cardBg, borderColor: loaderPalette.cardBorder }]}>
          <ActivityIndicator color={loaderPalette.spinner} size="large" />
          <Text style={[styles.loaderTitle, { color: loaderPalette.title }]}>GasFlow</Text>
          <Text style={[styles.loaderText, { color: loaderPalette.text }]}>Cargando sesión...</Text>
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

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { login, me } from './src/api/client';
import { AdminOrdersScreen } from './src/screens/AdminOrdersScreen';
import { AdminStockScreen } from './src/screens/AdminStockScreen';
import { DriverDeliveryScreen } from './src/screens/DriverDeliveryScreen';
import { DriverOrdersScreen } from './src/screens/DriverOrdersScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { clearToken, loadToken, saveToken } from './src/storage/session';
import { colors, spacing, typography } from './src/theme/tokens';
import { Order, Session } from './src/types';
import { AppMode, isModeAllowed } from './src/utils/mode';
import { AppButton } from './src/ui/primitives';

type Tab = {
  key: string;
  label: string;
};

function SegmentedTabs({
  tabs,
  current,
  onChange,
}: {
  tabs: Tab[];
  current: string;
  onChange: (key: string) => void;
}): React.JSX.Element {
  return (
    <View style={styles.tabsWrap}>
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tabButton, active ? styles.tabButtonActive : null]}
          >
            <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<AppMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<'orders' | 'stock'>('orders');
  const [driverTab, setDriverTab] = useState<'orders' | 'delivery'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      try {
        const token = await loadToken();
        if (!token) {
          return;
        }
        const profile = await me(token);
        setSession({
          token,
          userId: profile.id,
          username: profile.username,
          role: profile.role,
        });
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleLogin = async (username: string, password: string): Promise<void> => {
    const token = await login(username, password);
    const profile = await me(token);
    await saveToken(token);
    setSession({ token, userId: profile.id, username: profile.username, role: profile.role });
    setMode(null);
  };

  const handleLogout = async (): Promise<void> => {
    await clearToken();
    setSession(null);
    setMode(null);
    setSelectedOrder(null);
  };

  const activeMode = useMemo(() => {
    if (!session || !mode) return null;
    if (!isModeAllowed(session.role, mode)) return null;
    return mode;
  }, [session, mode]);
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderWrap}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loaderText}>Cargando sesión...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <LoginScreen onSubmit={handleLogin} />;
  }

  if (!activeMode) {
    return (
      <ModeSelectScreen
        role={session.role}
        username={session.username}
        onSelectMode={setMode}
        onLogout={handleLogout}
      />
    );
  }

  const tabs =
    activeMode === 'ADMIN'
      ? [
          { key: 'orders', label: 'Pedidos' },
          { key: 'stock', label: 'Stock' },
        ]
      : [
          { key: 'orders', label: 'Asignados' },
          { key: 'delivery', label: 'Entrega' },
        ];

  const currentTab = activeMode === 'ADMIN' ? adminTab : driverTab;

  return (
    <SafeAreaView style={styles.appWrap}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topBar, topInset > 0 ? { paddingTop: spacing.md + topInset } : null]}>
        <View>
          <Text style={styles.appName}>GasFlow</Text>
          <Text style={styles.appMeta}>
            {session.username} • {activeMode}
          </Text>
        </View>
        <View style={styles.topActions}>
          <AppButton title="Cambiar modo" tone="ghost" onPress={() => setMode(null)} />
          <AppButton title="Salir" tone="danger" onPress={handleLogout} />
        </View>
      </View>

      <SegmentedTabs
        tabs={tabs}
        current={currentTab}
        onChange={(value) => {
          if (activeMode === 'ADMIN') {
            setAdminTab(value as 'orders' | 'stock');
          } else {
            setDriverTab(value as 'orders' | 'delivery');
          }
        }}
      />

      <View style={styles.body}>
        {activeMode === 'ADMIN' ? (
          adminTab === 'orders' ? (
            <AdminOrdersScreen token={session.token} />
          ) : (
            <AdminStockScreen token={session.token} />
          )
        ) : driverTab === 'orders' ? (
          <DriverOrdersScreen
            token={session.token}
            onSelectOrder={(order) => {
              setSelectedOrder(order);
              setDriverTab('delivery');
            }}
            selectedOrderId={selectedOrder?.id}
          />
        ) : (
          <DriverDeliveryScreen
            token={session.token}
            selectedOrder={selectedOrder}
            onSuccess={async () => setDriverTab('orders')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appWrap: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loaderWrap: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loaderText: {
    ...typography.body,
    color: colors.textMuted,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#F9FCFB',
  },
  appName: {
    ...typography.title,
    color: colors.textStrong,
  },
  appMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabsWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#F9FCFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    ...typography.body,
    color: colors.textStrong,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontFamily: typography.section.fontFamily,
  },
  body: {
    flex: 1,
  },
});

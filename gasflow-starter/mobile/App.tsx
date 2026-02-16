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
import { AdminOrdersScreen } from './src/screens/AdminOrdersScreen';
import { AdminStockScreen } from './src/screens/AdminStockScreen';
import { DriverDeliveryScreen } from './src/screens/DriverDeliveryScreen';
import { DriverOrdersScreen } from './src/screens/DriverOrdersScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { useAuthStore } from './src/store/authStore';
import { useSyncQueue } from './src/hooks/useSyncQueue';
import { colors, radii, shadows, spacing, typography } from './src/theme/tokens';
import { Order } from './src/types';
import { isModeAllowed } from './src/utils/mode';
import { AppButton } from './src/ui/primitives';
import { ClipboardList, Package, Truck, UserCircle, LogOut, LayoutGrid, RotateCcw } from 'lucide-react-native';

type Tab = {
  key: string;
  label: string;
  icon: any;
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
      <View style={styles.tabsInner}>
        {tabs.map((tab) => {
          const active = tab.key === current;
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[styles.tabButton, active ? styles.tabButtonActive : null]}
            >
              <Icon size={18} color={active ? '#FFFFFF' : colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App(): React.JSX.Element {
  useSyncQueue();
  const { status, user, mode, setMode, logout, bootstrap, token } = useAuthStore();
  const [adminTab, setAdminTab] = useState<'orders' | 'stock'>('orders');
  const [driverTab, setDriverTab] = useState<'orders' | 'delivery'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const activeMode = useMemo(() => {
    if (!user || !mode) return null;
    if (!isModeAllowed(user.role, mode)) return null;
    return mode;
  }, [user, mode]);
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  if (status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={styles.loaderWrap}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loaderText}>Cargando sesión...</Text>
      </SafeAreaView>
    );
  }

  if (status === 'unauthenticated' || !user || !token) {
    return <LoginScreen />;
  }

  if (!activeMode) {
    return (
      <ModeSelectScreen
        role={user.role}
        username={user.username}
        onSelectMode={setMode}
        onLogout={() => {
          setSelectedOrder(null);
          void logout();
        }}
      />
    );
  }

  const tabs: Tab[] =
    activeMode === 'ADMIN'
      ? [
          { key: 'orders', label: 'Pedidos', icon: ClipboardList },
          { key: 'stock', label: 'Stock', icon: Package },
        ]
      : [
          { key: 'orders', label: 'Asignados', icon: Truck },
          { key: 'delivery', label: 'Entrega', icon: Package },
        ];

  const currentTab = activeMode === 'ADMIN' ? adminTab : driverTab;

  return (
    <SafeAreaView style={styles.appWrap}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topBar, topInset > 0 ? { paddingTop: spacing.sm + topInset } : null]}>
        <View style={styles.topBarContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <UserCircle color={colors.primary} size={32} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={styles.appName}>GasFlow</Text>
              <Text style={styles.appMeta}>
                {user.username} • {activeMode === 'ADMIN' ? 'Admin' : 'Repartidor'}
              </Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <Pressable 
              onPress={() => setMode(null)} 
              style={({pressed}) => [styles.actionCircle, pressed ? {opacity: 0.7} : null]}
            >
              <RotateCcw color={colors.textBase} size={20} />
            </Pressable>
            <Pressable 
              onPress={() => {
                setSelectedOrder(null);
                void logout();
              }} 
              style={({pressed}) => [styles.actionCircle, {backgroundColor: colors.dangerLight}, pressed ? {opacity: 0.7} : null]}
            >
              <LogOut color={colors.danger} size={20} />
            </Pressable>
          </View>
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
            <AdminOrdersScreen token={token} />
          ) : (
            <AdminStockScreen token={token} />
          )
        ) : driverTab === 'orders' ? (
          <DriverOrdersScreen
            token={token}
            onSelectOrder={(order) => {
              setSelectedOrder(order);
              setDriverTab('delivery');
            }}
            selectedOrderId={selectedOrder?.id}
          />
        ) : (
          <DriverDeliveryScreen
            token={token}
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...typography.title,
    color: colors.textStrong,
    fontSize: 18,
  },
  appMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -2,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  tabsInner: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    padding: 4,
    borderRadius: radii.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
});

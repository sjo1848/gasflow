import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, AdminTabParamList, DriverTabParamList } from './types';
import { useAuthStore } from '../store/authStore';

import { LoginScreen } from '../screens/LoginScreen';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { AdminOrdersScreen } from '../screens/AdminOrdersScreen';
import { AdminStockScreen } from '../screens/AdminStockScreen';
import { DriverOrdersScreen } from '../screens/DriverOrdersScreen';
import { DriverDeliveryScreen } from '../screens/DriverDeliveryScreen';

import { colors, radii, shadows, typography } from '../theme/tokens';
import { ClipboardList, Package, Truck, UserCircle, LogOut, RotateCcw } from 'lucide-react-native';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const DriverTab = createBottomTabNavigator<DriverTabParamList>();

function HeaderTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.userInfo}>
      <View style={styles.avatar}>
        <UserCircle color={colors.primary} size={24} strokeWidth={1.7} />
      </View>
      <View>
        <Text style={styles.appName}>{title}</Text>
        <Text style={styles.appMeta}>{subtitle}</Text>
      </View>
    </View>
  );
}

function HeaderRight({ onLogout, onChangeMode }: { onLogout: () => void; onChangeMode: () => void }) {
  return (
    <View style={styles.topActions}>
      <Pressable
        onPress={onChangeMode}
        style={({ pressed }) => [styles.actionCircle, pressed ? styles.actionPressed : null]}
      >
        <RotateCcw color={colors.textBase} size={17} />
      </Pressable>
      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [styles.actionCircle, styles.logoutAction, pressed ? styles.actionPressed : null]}
      >
        <LogOut color={colors.danger} size={17} />
      </Pressable>
    </View>
  );
}

const commonTabOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  tabBarLabelStyle: {
    ...typography.small,
    fontWeight: '700' as const,
  },
  headerStyle: {
    backgroundColor: colors.surface,
  },
  headerShadowVisible: false,
  animation: 'none' as const,
};

function AdminNavigator() {
  const { user, logout, setMode } = useAuthStore();

  return (
    <AdminTab.Navigator
      screenOptions={{
        ...commonTabOptions,
        headerTitle: () => <HeaderTitle title="GasFlow Admin" subtitle={user?.username || ''} />,
        headerRight: () => <HeaderRight onLogout={logout} onChangeMode={() => setMode(null)} />,
      }}
    >
      <AdminTab.Screen
        name="Orders"
        component={AdminOrdersScreen}
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <AdminTab.Screen
        name="Stock"
        component={AdminStockScreen}
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
    </AdminTab.Navigator>
  );
}

function DriverNavigator() {
  const { user, logout, setMode } = useAuthStore();

  return (
    <DriverTab.Navigator
      screenOptions={{
        ...commonTabOptions,
        headerTitle: () => <HeaderTitle title="GasFlow Reparto" subtitle={user?.username || ''} />,
        headerRight: () => <HeaderRight onLogout={logout} onChangeMode={() => setMode(null)} />,
      }}
    >
      <DriverTab.Screen
        name="AssignedOrders"
        options={{
          title: 'Asignados',
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      >
        {(props) => (
          <DriverOrdersScreen
            onSelectOrder={(order) => props.navigation.navigate('DeliveryDetail', { order })}
          />
        )}
      </DriverTab.Screen>
      <DriverTab.Screen
        name="DeliveryDetail"
        options={{
          title: 'Entrega',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      >
        {(props) => (
          <DriverDeliveryScreen
            selectedOrder={props.route.params?.order || null}
            onSuccess={async () => props.navigation.navigate('AssignedOrders')}
          />
        )}
      </DriverTab.Screen>
    </DriverTab.Navigator>
  );
}

export function RootNavigator() {
  const { status, user, mode, setMode, logout } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      {status === 'unauthenticated' || !user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !mode ? (
        <Stack.Screen name="ModeSelect">
          {() => (
            <ModeSelectScreen
              role={user.role}
              username={user.username}
              onSelectMode={setMode}
              onLogout={logout}
            />
          )}
        </Stack.Screen>
      ) : mode === 'ADMIN' ? (
        <Stack.Screen name="AdminDashboard" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="DriverDashboard" component={DriverNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  appName: {
    ...typography.section,
    color: colors.textStrong,
  },
  appMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -1,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 14,
  },
  actionCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  logoutAction: {
    backgroundColor: colors.dangerLight,
    borderColor: '#FFD6D1',
  },
  actionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});

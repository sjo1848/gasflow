import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, AdminTabParamList, DriverTabParamList } from './types';
import { useAuthStore } from '../store/authStore';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { AdminOrdersScreen } from '../screens/AdminOrdersScreen';
import { AdminStockScreen } from '../screens/AdminStockScreen';
import { DriverOrdersScreen } from '../screens/DriverOrdersScreen';
import { DriverDeliveryScreen } from '../screens/DriverDeliveryScreen';

// UI
import { colors, typography } from '../theme/tokens';
import { ClipboardList, Package, Truck, UserCircle, LogOut, RotateCcw } from 'lucide-react-native';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const DriverTab = createBottomTabNavigator<DriverTabParamList>();

function HeaderTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.userInfo}>
      <View style={styles.avatar}>
        <UserCircle color={colors.primary} size={28} strokeWidth={1.5} />
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
      <Pressable onPress={onChangeMode} style={({ pressed }) => [styles.actionCircle, pressed ? { opacity: 0.7 } : null]}>
        <RotateCcw color={colors.textBase} size={18} />
      </Pressable>
      <Pressable onPress={onLogout} style={({ pressed }) => [styles.actionCircle, { backgroundColor: colors.dangerLight }, pressed ? { opacity: 0.7 } : null]}>
        <LogOut color={colors.danger} size={18} />
      </Pressable>
    </View>
  );
}

function AdminNavigator() {
  const { user, logout, setMode } = useAuthStore();
  
  return (
    <AdminTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
        headerTitle: () => <HeaderTitle title="GasFlow Admin" subtitle={user?.username || ''} />,
        headerRight: () => <HeaderRight onLogout={logout} onChangeMode={() => setMode(null)} />,
        headerStyle: { backgroundColor: colors.surface },
      }}
    >
      <AdminTab.Screen 
        name="Orders" 
        component={AdminOrdersScreen}
        options={{ 
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> 
        }}
      />
      <AdminTab.Screen 
        name="Stock" 
        component={AdminStockScreen}
        options={{ 
          title: 'Stock',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> 
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
        headerTitle: () => <HeaderTitle title="GasFlow Reparto" subtitle={user?.username || ''} />,
        headerRight: () => <HeaderRight onLogout={logout} onChangeMode={() => setMode(null)} />,
        headerStyle: { backgroundColor: colors.surface },
      }}
    >
      <DriverTab.Screen 
        name="AssignedOrders" 
        options={{ 
          title: 'Asignados',
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} /> 
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
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> 
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...typography.title,
    fontSize: 16,
    color: colors.textStrong,
  },
  appMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -2,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 16,
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

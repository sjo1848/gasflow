import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { login, me } from './src/api/client';
import { AdminOrdersScreen } from './src/screens/AdminOrdersScreen';
import { AdminStockScreen } from './src/screens/AdminStockScreen';
import { DriverDeliveryScreen } from './src/screens/DriverDeliveryScreen';
import { DriverOrdersScreen } from './src/screens/DriverOrdersScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { clearToken, loadToken, saveToken } from './src/storage/session';
import { Order, Session } from './src/types';
import { AppMode, isModeAllowed } from './src/utils/mode';

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
    if (!session || !mode) {
      return null;
    }
    if (!isModeAllowed(session.role, mode)) {
      return null;
    }
    return mode;
  }, [session, mode]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
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

  if (activeMode === 'ADMIN') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Button title="Pedidos" onPress={() => setAdminTab('orders')} />
          <Button title="Stock" onPress={() => setAdminTab('stock')} />
          <Button title="Modo" onPress={() => setMode(null)} />
          <Button title="Salir" onPress={handleLogout} color="#8A2E2E" />
        </View>
        {adminTab === 'orders' ? (
          <AdminOrdersScreen token={session.token} />
        ) : (
          <AdminStockScreen token={session.token} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Button title="Pedidos" onPress={() => setDriverTab('orders')} />
        <Button title="Entrega" onPress={() => setDriverTab('delivery')} />
        <Button title="Modo" onPress={() => setMode(null)} />
        <Button title="Salir" onPress={handleLogout} color="#8A2E2E" />
      </View>
      {driverTab === 'orders' ? (
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
          onSuccess={async () => {
            setDriverTab('orders');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#F8FAFC',
  },
});

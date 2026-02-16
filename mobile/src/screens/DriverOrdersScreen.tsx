import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listOrders } from '../api/client';
import { Order } from '../types';

interface Props {
  token: string;
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: string;
}

export function DriverOrdersScreen({ token, onSelectOrder, selectedOrderId }: Props): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    try {
      setError(null);
      const data = await listOrders(token);
      setOrders(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <Text style={styles.title}>Repartidor • Pedidos asignados</Text>
        <Button title="Refrescar" onPress={refresh} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {orders.map((order) => (
        <TouchableOpacity
          key={order.id}
          style={[styles.card, order.id === selectedOrderId ? styles.cardSelected : null]}
          onPress={() => onSelectOrder(order)}
        >
          <Text style={styles.cardTitle}>{order.address}</Text>
          <Text>{order.id}</Text>
          <Text>{order.scheduled_date} • {order.time_slot}</Text>
          <Text>Estado: {order.status}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5F2' },
  content: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  card: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, backgroundColor: '#FFF' },
  cardSelected: { borderColor: '#355070', borderWidth: 2 },
  cardTitle: { fontWeight: '700' },
  error: { color: '#B00020' },
});

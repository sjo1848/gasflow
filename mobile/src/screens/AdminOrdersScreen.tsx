import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { assignOrders, createOrder, listOrders } from '../api/client';
import { Order } from '../types';

interface Props {
  token: string;
}

export function AdminOrdersScreen({ token }: Props): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('Z1');
  const [scheduledDate, setScheduledDate] = useState('2026-02-20');
  const [timeSlot, setTimeSlot] = useState('MANANA');
  const [quantity, setQuantity] = useState('1');
  const [orderToAssign, setOrderToAssign] = useState('');
  const [driverId, setDriverId] = useState('00000000-0000-0000-0000-000000000002');

  const refreshOrders = async (): Promise<void> => {
    try {
      setError(null);
      const data = await listOrders(token);
      setOrders(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void refreshOrders();
  }, []);

  const handleCreate = async (): Promise<void> => {
    try {
      setError(null);
      await createOrder(token, {
        address,
        zone,
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
        quantity: Number(quantity),
      });
      setAddress('');
      await refreshOrders();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAssign = async (): Promise<void> => {
    try {
      setError(null);
      await assignOrders(token, [orderToAssign], driverId);
      await refreshOrders();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin • Pedidos y Asignación</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>Crear pedido</Text>
      <TextInput style={styles.input} placeholder="Dirección" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Zona" value={zone} onChangeText={setZone} />
      <TextInput
        style={styles.input}
        placeholder="Fecha YYYY-MM-DD"
        value={scheduledDate}
        onChangeText={setScheduledDate}
      />
      <TextInput style={styles.input} placeholder="Franja" value={timeSlot} onChangeText={setTimeSlot} />
      <TextInput
        style={styles.input}
        placeholder="Cantidad"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="number-pad"
      />
      <Button title="Crear pedido" onPress={handleCreate} />

      <View style={styles.divider} />

      <Text style={styles.section}>Asignar pedido</Text>
      <TextInput
        style={styles.input}
        placeholder="Order ID"
        value={orderToAssign}
        onChangeText={setOrderToAssign}
      />
      <TextInput style={styles.input} placeholder="Driver ID" value={driverId} onChangeText={setDriverId} />
      <Button title="Asignar" onPress={handleAssign} />

      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.section}>Listado de pedidos</Text>
        <Button title="Refrescar" onPress={refreshOrders} />
      </View>

      {orders.map((order) => (
        <View key={order.id} style={styles.card}>
          <Text style={styles.cardTitle}>{order.address}</Text>
          <Text>{order.id}</Text>
          <Text>{order.scheduled_date} • {order.time_slot}</Text>
          <Text>Estado: {order.status}</Text>
          <Text>Repartidor: {order.assignee_id || 'sin asignar'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1EA' },
  content: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#2D3142' },
  section: { fontSize: 16, fontWeight: '600', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#C9C9C9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  divider: { height: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, backgroundColor: '#FFF' },
  cardTitle: { fontWeight: '700' },
  error: { color: '#B00020' },
});

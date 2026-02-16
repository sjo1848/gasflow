import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { registerDelivery, registerFailedDelivery } from '../api/client';
import { Order } from '../types';

interface Props {
  token: string;
  selectedOrder: Order | null;
  onSuccess: () => Promise<void>;
}

export function DriverDeliveryScreen({ token, selectedOrder, onSuccess }: Props): React.JSX.Element {
  const [llenas, setLlenas] = useState('1');
  const [vacias, setVacias] = useState('0');
  const [reason, setReason] = useState('cliente ausente');
  const [reprogramDate, setReprogramDate] = useState('2026-02-20');
  const [reprogramSlot, setReprogramSlot] = useState('MANANA');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleDelivered = async (): Promise<void> => {
    if (!selectedOrder) return;

    try {
      setError(null);
      setMessage(null);
      await registerDelivery(token, {
        order_id: selectedOrder.id,
        llenas_entregadas: Number(llenas),
        vacias_recibidas: Number(vacias),
      });
      setMessage('Entrega registrada');
      await onSuccess();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleFailed = async (): Promise<void> => {
    if (!selectedOrder) return;

    try {
      setError(null);
      setMessage(null);
      await registerFailedDelivery(token, {
        order_id: selectedOrder.id,
        reason,
        reprogram_date: reprogramDate,
        reprogram_time_slot: reprogramSlot,
      });
      setMessage('Entrega fallida registrada y reprogramada');
      await onSuccess();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Repartidor • Registrar entrega</Text>
      <Text style={styles.selected}>Pedido: {selectedOrder ? selectedOrder.id : 'seleccionar pedido'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}

      <TextInput style={styles.input} value={llenas} onChangeText={setLlenas} placeholder="Llenas" keyboardType="number-pad" />
      <TextInput style={styles.input} value={vacias} onChangeText={setVacias} placeholder="Vacías" keyboardType="number-pad" />
      <Button title="Marcar entregado" onPress={handleDelivered} disabled={!selectedOrder} />

      <View style={styles.divider} />
      <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Motivo" />
      <TextInput style={styles.input} value={reprogramDate} onChangeText={setReprogramDate} placeholder="Reprogramar fecha YYYY-MM-DD" />
      <TextInput style={styles.input} value={reprogramSlot} onChangeText={setReprogramSlot} placeholder="Franja" />
      <Button title="Registrar fallida" onPress={handleFailed} disabled={!selectedOrder} color="#8A2E2E" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F2F6FF', gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  selected: { color: '#1D3557' },
  input: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  divider: { height: 8 },
  error: { color: '#B00020' },
  ok: { color: '#0A7E2F' },
});

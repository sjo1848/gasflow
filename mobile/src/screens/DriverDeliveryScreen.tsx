import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { registerDelivery, registerFailedDelivery } from '../api/client';
import { Order } from '../types';
import { colors, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, Chip } from '../ui/primitives';

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
      setMessage('Entrega registrada correctamente.');
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
      setMessage('Entrega fallida registrada y pedido reprogramado.');
      await onSuccess();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar entrega</Text>
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderLabel}>Pedido seleccionado</Text>
          <Chip label={selectedOrder ? selectedOrder.status : 'SIN_PEDIDO'} tone="info" />
        </View>
        <Text style={styles.orderId}>{selectedOrder ? selectedOrder.id : 'Seleccioná un pedido primero'}</Text>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Entrega exitosa</Text>
        <AppInput label="Llenas entregadas" value={llenas} onChangeText={setLlenas} keyboardType="number-pad" />
        <AppInput label="Vacías recibidas" value={vacias} onChangeText={setVacias} keyboardType="number-pad" />
        <AppButton title="Marcar como entregado" onPress={handleDelivered} disabled={!selectedOrder} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Entrega fallida / reprogramación</Text>
        <AppInput label="Motivo" value={reason} onChangeText={setReason} />
        <AppInput label="Nueva fecha" value={reprogramDate} onChangeText={setReprogramDate} placeholder="YYYY-MM-DD" />
        <AppInput label="Nueva franja" value={reprogramSlot} onChangeText={setReprogramSlot} />
        <AppButton title="Registrar fallida" tone="danger" onPress={handleFailed} disabled={!selectedOrder} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textStrong,
  },
  orderCard: {
    gap: spacing.xs,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  orderId: {
    ...typography.body,
    color: colors.textStrong,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  ok: {
    ...typography.caption,
    color: colors.success,
  },
  card: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
});

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { registerDelivery, registerFailedDelivery } from '../api/client';
import { Order } from '../types';
import { colors, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, Chip, EmptyState, InlineMessage } from '../ui/primitives';

interface Props {
  token: string;
  selectedOrder: Order | null;
  onSuccess: () => Promise<void>;
}

export function DriverDeliveryScreen({ token, selectedOrder, onSuccess }: Props): React.JSX.Element {
  const [llenas, setLlenas] = useState('1');
  const [vacias, setVacias] = useState('0');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('cliente ausente');
  const [reprogramDate, setReprogramDate] = useState('2026-02-20');
  const [reprogramSlot, setReprogramSlot] = useState('MANANA');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submittingDelivered, setSubmittingDelivered] = useState(false);
  const [submittingFailed, setSubmittingFailed] = useState(false);

  const handleDelivered = async (): Promise<void> => {
    if (!selectedOrder) return;

    if (!Number.isFinite(Number(llenas)) || Number(llenas) < 0) {
      setError('Llenas entregadas debe ser un número mayor o igual a cero.');
      return;
    }

    if (!Number.isFinite(Number(vacias)) || Number(vacias) < 0) {
      setError('Vacías recibidas debe ser un número mayor o igual a cero.');
      return;
    }

    try {
      setSubmittingDelivered(true);
      setError(null);
      setMessage(null);
      await registerDelivery(token, {
        order_id: selectedOrder.id,
        llenas_entregadas: Number(llenas),
        vacias_recibidas: Number(vacias),
        notes: notes.trim() || undefined,
      });
      setMessage('Entrega registrada correctamente.');
      await onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingDelivered(false);
    }
  };

  const handleFailed = async (): Promise<void> => {
    if (!selectedOrder) return;

    if (!reason.trim()) {
      setError('El motivo es obligatorio para registrar entrega fallida.');
      return;
    }

    try {
      setSubmittingFailed(true);
      setError(null);
      setMessage(null);
      await registerFailedDelivery(token, {
        order_id: selectedOrder.id,
        reason: reason.trim(),
        reprogram_date: reprogramDate,
        reprogram_time_slot: reprogramSlot,
      });
      setMessage('Entrega fallida registrada y pedido reprogramado.');
      await onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingFailed(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Registrar entrega</Text>
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderLabel}>Pedido seleccionado</Text>
          <Chip label={selectedOrder ? selectedOrder.status : 'SIN_PEDIDO'} tone="info" />
        </View>
        <Text style={styles.orderId}>{selectedOrder ? selectedOrder.id : 'Seleccioná un pedido primero'}</Text>
      </Card>

      {error ? <InlineMessage tone="error" text={error} /> : null}
      {message ? <InlineMessage tone="success" text={message} /> : null}

      {!selectedOrder ? (
        <EmptyState
          title="Todavía no seleccionaste un pedido"
          description="Volvé a la pestaña Asignados y tocá un domicilio para cargar la entrega."
        />
      ) : (
        <>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Entrega exitosa</Text>
            <AppInput label="Llenas entregadas" value={llenas} onChangeText={setLlenas} keyboardType="number-pad" />
            <AppInput label="Vacías recibidas" value={vacias} onChangeText={setVacias} keyboardType="number-pad" />
            <AppInput label="Notas (opcional)" value={notes} onChangeText={setNotes} />
            <AppButton
              title="Marcar como entregado"
              onPress={handleDelivered}
              loading={submittingDelivered}
              disabled={submittingFailed}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Entrega fallida / reprogramación</Text>
            <AppInput label="Motivo" value={reason} onChangeText={setReason} />
            <AppInput label="Nueva fecha" value={reprogramDate} onChangeText={setReprogramDate} placeholder="YYYY-MM-DD" />
            <AppInput label="Nueva franja" value={reprogramSlot} onChangeText={setReprogramSlot} />
            <AppButton
              title="Registrar fallida"
              tone="danger"
              onPress={handleFailed}
              loading={submittingFailed}
              disabled={submittingDelivered}
            />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 120,
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
  card: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
});

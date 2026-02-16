import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { registerDelivery, registerFailedDelivery } from '../api/client';
import { Order } from '../types';
import { useDeliveryStore } from '../store/deliveryStore';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, Badge, EmptyState, InlineMessage } from '../ui/primitives';
import { CheckCircle2, XCircle, Info, MapPin, PackageCheck, AlertTriangle } from 'lucide-react-native';

interface Props {
  token: string;
  selectedOrder: Order | null;
  onSuccess: () => Promise<void>;
}

export function DriverDeliveryScreen({ token, selectedOrder, onSuccess }: Props): React.JSX.Element {
  const addToQueue = useDeliveryStore((state) => state.addToQueue);
  const queue = useDeliveryStore((state) => state.queue);
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

  const isNetworkError = (msg: string) => 
    msg.includes('No se pudo conectar') || msg.includes('tardó demasiado');

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

    const payload = {
      order_id: selectedOrder.id,
      llenas_entregadas: Number(llenas),
      vacias_recibidas: Number(vacias),
      notes: notes.trim() || undefined,
    };

    try {
      setSubmittingDelivered(true);
      setError(null);
      setMessage(null);
      await registerDelivery(token, payload);
      setMessage('Entrega registrada correctamente.');
      await onSuccess();
    } catch (err: any) {
      if (isNetworkError(err.message)) {
        addToQueue({ type: 'SUCCESS', token, payload });
        setMessage('Sin conexión. La entrega se guardó localmente y se sincronizará luego.');
        await onSuccess();
      } else {
        setError(err.message);
      }
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

    const payload = {
      order_id: selectedOrder.id,
      reason: reason.trim(),
      reprogram_date: reprogramDate,
      reprogram_time_slot: reprogramSlot,
    };

    try {
      setSubmittingFailed(true);
      setError(null);
      setMessage(null);
      await registerFailedDelivery(token, payload);
      setMessage('Entrega fallida registrada.');
      await onSuccess();
    } catch (err: any) {
      if (isNetworkError(err.message)) {
        addToQueue({ type: 'FAILED', token, payload });
        setMessage('Sin conexión. El fallo se guardó localmente y se sincronizará luego.');
        await onSuccess();
      } else {
        setError(err.message);
      }
    } finally {
      setSubmittingFailed(false);
    }
  };

  const pendingCount = queue.filter(q => q.token === token).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Registrar entrega</Text>
          <Text style={styles.subtitle}>Completá los datos de la visita</Text>
        </View>
        {pendingCount > 0 && (
          <Badge label={`${pendingCount} pendiente(s)`} tone="warning" />
        )}
      </View>

      {!selectedOrder ? (
        <EmptyState
          title="Todavía no seleccionaste un pedido"
          description="Volvé a la pestaña Asignados y tocá un domicilio para cargar la entrega."
          icon={MapPin}
        />
      ) : (
        <>
          <Card style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.addressLine}>
                <MapPin size={18} color={colors.primary} />
                <Text style={styles.addressText}>{selectedOrder.address}</Text>
              </View>
              <Badge label={selectedOrder.status} tone="info" size="sm" />
            </View>
            <View style={styles.orderDivider} />
            <Text style={styles.orderId}>ID: {selectedOrder.id}</Text>
          </Card>

          {error ? <InlineMessage tone="error" text={error} icon={AlertTriangle} /> : null}
          {message ? <InlineMessage tone="success" text={message} icon={CheckCircle2} /> : null}

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <PackageCheck size={20} color={colors.success} />
              <Text style={styles.sectionTitle}>Entrega Exitosa</Text>
            </View>
            <View style={styles.inputGrid}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Llenas"
                  value={llenas}
                  onChangeText={setLlenas}
                  keyboardType="number-pad"
                  testID="input-llenas"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Vacías"
                  value={vacias}
                  onChangeText={setVacias}
                  keyboardType="number-pad"
                  testID="input-vacias"
                />
              </View>
            </View>
            <AppInput 
              label="Notas de la entrega" 
              value={notes} 
              onChangeText={setNotes} 
              testID="input-notes"
              placeholder="Ej: Se dejó en la entrada..."
              multiline
            />
            <AppButton
              title="Confirmar Entrega"
              onPress={handleDelivered}
              loading={submittingDelivered}
              disabled={submittingFailed}
              icon={CheckCircle2}
            />
          </Card>

          <Card style={[styles.card, styles.cardDanger]}>
            <View style={styles.sectionHeader}>
              <XCircle size={20} color={colors.danger} />
              <Text style={styles.sectionTitle}>Entrega Fallida</Text>
            </View>
            <AppInput 
              label="Motivo del fallo" 
              value={reason} 
              onChangeText={setReason} 
              placeholder="Ej: Cliente ausente"
            />
            <View style={styles.inputGrid}>
              <View style={{ flex: 1 }}>
                <AppInput label="Reprogramar" value={reprogramDate} onChangeText={setReprogramDate} placeholder="YYYY-MM-DD" />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Franja" value={reprogramSlot} onChangeText={setReprogramSlot} />
              </View>
            </View>
            <AppButton
              title="Registrar Fallo"
              tone="outline"
              onPress={handleFailed}
              loading={submittingFailed}
              disabled={submittingDelivered}
              icon={XCircle}
              style={{ borderColor: colors.danger }}
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
    ...typography.h1,
    color: colors.textStrong,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderCard: {
    backgroundColor: colors.surfaceHighlight,
    borderColor: colors.primaryLight,
    padding: spacing.md,
    gap: spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressLine: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  addressText: {
    ...typography.section,
    color: colors.primary,
    flex: 1,
  },
  orderDivider: {
    height: 1,
    backgroundColor: colors.primaryLight,
    opacity: 0.5,
  },
  orderId: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardDanger: {
    borderColor: colors.dangerLight,
    backgroundColor: colors.surfaceSoft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});

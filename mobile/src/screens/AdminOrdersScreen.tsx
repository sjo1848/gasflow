import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { assignOrders, createOrder, listOrders } from '../api/client';
import { Order } from '../types';
import { colors, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, Chip } from '../ui/primitives';

interface Props {
  token: string;
}

function statusTone(status: string): 'neutral' | 'success' | 'danger' | 'info' | 'warning' {
  if (status === 'ENTREGADO') return 'success';
  if (status === 'EN_REPARTO') return 'info';
  if (status === 'ASIGNADO') return 'warning';
  return 'neutral';
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

  const summary = useMemo(() => {
    return {
      total: orders.length,
      pendientes: orders.filter((o) => o.status === 'PENDIENTE').length,
      entregados: orders.filter((o) => o.status === 'ENTREGADO').length,
    };
  }, [orders]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pedidos y Asignación</Text>
      <Text style={styles.subtitle}>Gestión diaria operativa de reparto</Text>

      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total</Text>
          <Text style={styles.metricValue}>{summary.total}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pendientes</Text>
          <Text style={styles.metricValue}>{summary.pendientes}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Entregados</Text>
          <Text style={styles.metricValue}>{summary.entregados}</Text>
        </Card>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Crear pedido</Text>
        <AppInput label="Dirección" placeholder="Calle 123" value={address} onChangeText={setAddress} />
        <AppInput label="Zona" value={zone} onChangeText={setZone} />
        <AppInput label="Fecha" placeholder="YYYY-MM-DD" value={scheduledDate} onChangeText={setScheduledDate} />
        <AppInput label="Franja" value={timeSlot} onChangeText={setTimeSlot} />
        <AppInput label="Cantidad" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
        <AppButton title="Crear pedido" onPress={handleCreate} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Asignar pedido</Text>
        <AppInput label="Order ID" value={orderToAssign} onChangeText={setOrderToAssign} />
        <AppInput label="Driver ID" value={driverId} onChangeText={setDriverId} />
        <View style={styles.actionsRow}>
          <AppButton title="Asignar" onPress={handleAssign} />
          <AppButton title="Refrescar" tone="ghost" onPress={refreshOrders} />
        </View>
      </Card>

      <Text style={styles.sectionHeader}>Listado</Text>
      {orders.map((order) => (
        <Card key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderAddress}>{order.address}</Text>
            <Chip label={order.status} tone={statusTone(order.status)} />
          </View>
          <Text style={styles.metaLine}>{order.scheduled_date} • {order.time_slot} • Zona {order.zone}</Text>
          <Text style={styles.metaLine}>ID: {order.id}</Text>
          <Text style={styles.metaLine}>Repartidor: {order.assignee_id || 'sin asignar'}</Text>
        </Card>
      ))}
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
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: -8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metricValue: {
    ...typography.title,
    color: colors.textStrong,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionHeader: {
    ...typography.section,
    color: colors.textStrong,
    marginTop: spacing.xs,
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
  orderAddress: {
    ...typography.section,
    color: colors.textStrong,
    flex: 1,
  },
  metaLine: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { listOrders } from '../api/client';
import { Order } from '../types';
import { colors, spacing, typography } from '../theme/tokens';
import { AppButton, Card, Chip } from '../ui/primitives';

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
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Pedidos asignados</Text>
          <Text style={styles.subtitle}>Seleccioná uno para registrar entrega</Text>
        </View>
        <AppButton title="Refrescar" tone="ghost" onPress={refresh} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {orders.map((order) => (
        <Pressable key={order.id} onPress={() => onSelectOrder(order)} style={styles.pressableCard}>
          <Card style={[styles.card, order.id === selectedOrderId ? styles.cardSelected : null]}>
            <View style={styles.cardHeader}>
              <Text style={styles.address}>{order.address}</Text>
              <Chip label={order.status} tone={order.status === 'ENTREGADO' ? 'success' : 'warning'} />
            </View>
            <Text style={styles.meta}>{order.scheduled_date} • {order.time_slot}</Text>
            <Text style={styles.meta}>ID: {order.id}</Text>
          </Card>
        </Pressable>
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
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textStrong,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  pressableCard: {
    borderRadius: 16,
  },
  card: {
    gap: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F2FAF6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  address: {
    ...typography.section,
    color: colors.textStrong,
    flex: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

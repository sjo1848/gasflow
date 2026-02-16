import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { listOrders } from '../api/client';
import { Order } from '../types';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';
import { AppButton, Card, Badge, EmptyState, InlineMessage, LoadingBlock } from '../ui/primitives';
import { MapPin, Clock, Info, ChevronRight, Hash, Calendar } from 'lucide-react-native';

interface Props {
  token: string;
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: string;
}

export function DriverOrdersScreen({ token, onSelectOrder, selectedOrderId }: Props): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async (showLoader = true): Promise<void> => {
    try {
      if (showLoader) {
        setLoadingOrders(true);
      }
      setError(null);
      const data = await listOrders(token);
      setOrders(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (showLoader) {
        setLoadingOrders(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh(true);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    void refresh(false);
  }, []);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Mis Entregas</Text>
          <Text style={styles.subtitle}>Seleccioná un pedido para registrar la visita</Text>
        </View>
      </View>

      {error ? <InlineMessage tone="error" text={error} /> : null}

      {loadingOrders && !refreshing ? (
        <LoadingBlock label="Cargando pedidos..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No tenés pedidos asignados"
          description="Cuando despacho te asigne rutas aparecerán en esta sección."
          icon={Truck}
        />
      ) : (
        orders.map((order) => {
          const isSelected = order.id === selectedOrderId;
          const isDelivered = order.status === 'ENTREGADO';
          
          return (
            <Pressable key={order.id} onPress={() => onSelectOrder(order)} style={styles.pressableCard}>
              <Card style={[styles.card, isSelected ? styles.cardSelected : null]}>
                <View style={styles.cardHeader}>
                  <View style={styles.addressBox}>
                    <MapPin size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <Text style={styles.address} numberOfLines={2}>{order.address}</Text>
                  </View>
                  <Badge 
                    label={order.status} 
                    tone={isDelivered ? 'success' : 'warning'} 
                    size="sm"
                  />
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{order.scheduled_date}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{order.time_slot}</Text>
                  </View>
                </View>

                {order.notes ? (
                  <View style={styles.notesBox}>
                    <Info size={14} color={colors.secondary} />
                    <Text style={styles.notes} numberOfLines={2}>{order.notes}</Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.idBox}>
                    <Hash size={12} color={colors.textMuted} />
                    <Text style={styles.idText}>{order.id.split('-')[0]}</Text>
                  </View>
                  <View style={styles.actionPrompt}>
                    <Text style={[styles.actionText, isSelected ? {color: colors.primary} : null]}>
                      {isSelected ? 'Seleccionado' : 'Ver detalle'}
                    </Text>
                    <ChevronRight size={16} color={isSelected ? colors.primary : colors.border} />
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })
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
  headRow: {
    marginBottom: spacing.sm,
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
  pressableCard: {
    borderRadius: radii.lg,
  },
  card: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
  },
  cardSelected: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.surfaceHighlight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  addressBox: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  address: {
    ...typography.section,
    color: colors.textStrong,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textBase,
  },
  notesBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    padding: spacing.sm,
    borderRadius: radii.sm,
    gap: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notes: {
    ...typography.caption,
    color: colors.textBase,
    fontStyle: 'italic',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  idBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  idText: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
  },
});

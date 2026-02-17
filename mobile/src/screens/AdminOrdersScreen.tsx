import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl, Pressable, Platform } from 'react-native';
import { useOrders, useCreateOrder, useAssignOrders } from '../hooks/queries';
import { useAuthStore } from '../store/authStore';
import { Order } from '../types';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, Badge, EmptyState, InlineMessage, Skeleton } from '../ui/primitives';
import { Plus, UserPlus, ClipboardCheck, ListFilter, MapPin, Calendar, Clock, Info, RefreshCw, AlertCircle } from 'lucide-react-native';

export function AdminOrdersScreen(): React.JSX.Element {
  const token = useAuthStore((state) => state.token);
  const { data: orders, isLoading, isRefetching, refetch, error: loadError } = useOrders(token || '');
  const createOrderMutation = useCreateOrder();
  const assignOrdersMutation = useAssignOrders();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showCreate, setShowCreate] = useState(false);
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('Z1');
  const [scheduledDate, setScheduledDate] = useState('2026-02-20');
  const [timeSlot, setTimeSlot] = useState('MAÑANA');
  const [quantity, setQuantity] = useState('1');
  
  const [orderToAssign, setOrderToAssign] = useState('');
  const [driverId, setDriverId] = useState('00000000-0000-0000-0000-000000000002');

  const handleCreate = async (): Promise<void> => {
    if (!address.trim() || !token) {
      setError('La dirección es obligatoria.');
      return;
    }

    createOrderMutation.mutate({
      token,
      payload: {
        address: address.trim(),
        zone,
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
        quantity: Number(quantity),
      }
    }, {
      onSuccess: () => {
        setAddress('');
        setMessage('Pedido creado correctamente.');
        setShowCreate(false);
        setError(null);
      },
      onError: (err) => {
        setError(err.message);
      }
    });
  };

  const handleAssign = async (): Promise<void> => {
    if (!orderToAssign.trim() || !driverId.trim() || !token) {
      setError('ID de Pedido y ID de Repartidor son obligatorios.');
      return;
    }

    assignOrdersMutation.mutate({
      token,
      orderIds: [orderToAssign.trim()],
      driverId: driverId.trim()
    }, {
      onSuccess: () => {
        setMessage('Pedido asignado correctamente.');
        setOrderToAssign('');
        setError(null);
      },
      onError: (err) => {
        setError(err.message);
      }
    });
  };

  const summary = useMemo(() => {
    if (!orders) return { total: 0, pendientes: 0, entregados: 0 };
    return {
      total: orders.length,
      pendientes: orders.filter((o) => o.status === 'PENDIENTE').length,
      entregados: orders.filter((o) => o.status === 'ENTREGADO').length,
    };
  }, [orders]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gestión de Pedidos</Text>
          <Text style={styles.subtitle}>Control operativo del día</Text>
        </View>
        <AppButton 
          title={showCreate ? "Cerrar" : "Nuevo"} 
          tone={showCreate ? "outline" : "primary"}
          icon={showCreate ? Info : Plus}
          onPress={() => setShowCreate(!showCreate)}
          style={styles.headerBtn}
        />
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricBox, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={styles.metricValue}>{summary.total}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={[styles.metricBox, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.metricValue, { color: colors.warning }]}>{summary.pendientes}</Text>
          <Text style={styles.metricLabel}>Pend.</Text>
        </View>
        <View style={[styles.metricBox, { backgroundColor: colors.successLight }]}>
          <Text style={[styles.metricValue, { color: colors.success }]}>{summary.entregados}</Text>
          <Text style={styles.metricLabel}>Entreg.</Text>
        </View>
      </View>

      {(error || loadError) ? <InlineMessage tone="error" text={error || (loadError as Error).message} icon={AlertCircle} /> : null}
      {message ? <InlineMessage tone="success" text={message} /> : null}

      {showCreate && (
        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Plus size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Crear Nuevo Pedido</Text>
          </View>
          <AppInput label="Dirección de entrega" placeholder="Av. Siempre Viva 742" value={address} onChangeText={setAddress} icon={MapPin} />
          <View style={styles.inputGrid}>
            <View style={{ flex: 1 }}>
              <AppInput label="Zona" value={zone} onChangeText={setZone} />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput label="Cantidad" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
            </View>
          </View>
          <View style={styles.inputGrid}>
            <View style={{ flex: 1 }}>
              <AppInput label="Fecha" value={scheduledDate} onChangeText={setScheduledDate} icon={Calendar} />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput label="Franja" value={timeSlot} onChangeText={setTimeSlot} icon={Clock} />
            </View>
          </View>
          <AppButton 
            title="Confirmar Pedido" 
            onPress={handleCreate} 
            loading={createOrderMutation.isPending} 
            haptic="success" 
            style={{ marginTop: 8 }} 
          />
        </Card>
      )}

      <Card style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <UserPlus size={18} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Asignación Rápida</Text>
        </View>
        <View style={styles.assignRow}>
          <View style={{ flex: 1.5 }}>
            <AppInput placeholder="ID del Pedido" value={orderToAssign} onChangeText={setOrderToAssign} />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton 
              title="Asignar" 
              onPress={handleAssign} 
              loading={assignOrdersMutation.isPending} 
              haptic="medium" 
              style={styles.assignBtn} 
            />
          </View>
        </View>
      </Card>

      <View style={styles.listHeader}>
        <View style={styles.listHeaderMain}>
          <ListFilter size={18} color={colors.textStrong} />
          <Text style={styles.listTitle}>Lista de Pedidos</Text>
        </View>
        <Pressable onPress={() => refetch()} style={styles.refreshIcon}>
          <RefreshCw size={16} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ gap: spacing.sm }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} style={styles.orderCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width="70%" height={20} />
                <Skeleton width={60} height={20} borderRadius={radii.full} />
              </View>
              <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
              <View style={{ height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.sm }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width="20%" height={12} />
                <Skeleton width="30%" height={12} />
              </View>
            </Card>
          ))}
        </View>
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          title="No hay pedidos registrados"
          description="Comenzá creando un pedido nuevo usando el botón superior."
          icon={ClipboardCheck}
        />
      ) : (
        orders.map((order) => (
          <Card key={order.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderAddress}>{order.address}</Text>
                <View style={styles.orderMeta}>
                  <Text style={styles.metaText}>{order.scheduled_date} • {order.time_slot}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.metaText}>Zona {order.zone}</Text>
                </View>
              </View>
              <Badge label={order.status} tone={statusTone(order.status)} size="sm" />
            </View>
            <View style={styles.orderDivider} />
            <View style={styles.orderFooter}>
              <Text style={styles.orderId}>ID: {order.id.split('-')[0]}...</Text>
              <View style={styles.assigneeBox}>
                <Text style={styles.assigneeText}>
                  {order.assignee_id ? `👤 Repartidor: ${order.assignee_id.split('-')[0]}...` : '⚠️ Sin asignar'}
                </Text>
              </View>
            </View>
          </Card>
        ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
  headerBtn: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricValue: {
    ...typography.h1,
    fontSize: 22,
    color: colors.textStrong,
  },
  metricLabel: {
    ...typography.small,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  formCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  assignBtn: {
    height: 52,
    marginBottom: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  listHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
  refreshIcon: {
    padding: 8,
  },
  orderCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  orderInfo: {
    flex: 1,
    gap: 4,
  },
  orderAddress: {
    ...typography.section,
    fontSize: 15,
    color: colors.textStrong,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  orderDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    ...typography.small,
    color: colors.textMuted,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  assigneeBox: {
    backgroundColor: colors.surfaceSoft,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  assigneeText: {
    ...typography.small,
    color: colors.textBase,
    fontWeight: '600',
  },
});

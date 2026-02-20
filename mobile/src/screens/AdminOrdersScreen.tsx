import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAssignOrders, useCreateOrder, useOrders } from '../hooks/queries';
import { useAuthStore } from '../store/authStore';
import { Order, OrderStatus } from '../types';
import { colors, layout, radii, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Badge, Card, EmptyState, InlineMessage, Skeleton } from '../ui/primitives';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ClipboardCheck,
  Clock,
  ListFilter,
  MapPin,
  Plus,
  RefreshCw,
  UserPlus,
} from 'lucide-react-native';
import { todayIsoDate } from '../utils/date';

type ListFilterType = 'TODOS' | OrderStatus;

function statusTone(status: OrderStatus): 'neutral' | 'success' | 'danger' | 'info' | 'warning' {
  switch (status) {
    case 'ENTREGADO':
      return 'success';
    case 'EN_REPARTO':
      return 'info';
    case 'ASIGNADO':
      return 'warning';
    default:
      return 'neutral';
  }
}

const driverIdSeed = '00000000-0000-0000-0000-000000000002';

export function AdminOrdersScreen(): React.JSX.Element {
  const token = useAuthStore((state) => state.token);
  const { data: orders, isLoading, isRefetching, refetch, error: loadError } = useOrders(token || '');
  const createOrderMutation = useCreateOrder();
  const assignOrdersMutation = useAssignOrders();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilterType>('TODOS');

  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('Z1');
  const [scheduledDate, setScheduledDate] = useState(todayIsoDate());
  const [timeSlot, setTimeSlot] = useState('MANANA');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  const [orderToAssign, setOrderToAssign] = useState('');
  const [driverId, setDriverId] = useState(driverIdSeed);

  const clearFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleCreate = (): void => {
    clearFeedback();

    if (!address.trim() || !token) {
      setError('La direccion es obligatoria.');
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('La cantidad debe ser mayor a cero.');
      return;
    }

    createOrderMutation.mutate(
      {
        token,
        payload: {
          address: address.trim(),
          zone: zone.trim() || 'Z1',
          scheduled_date: scheduledDate,
          time_slot: timeSlot.trim() || 'MANANA',
          quantity: parsedQuantity,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setAddress('');
          setNotes('');
          setQuantity('1');
          setShowCreate(false);
          setMessage('Pedido creado correctamente.');
        },
        onError: (err) => {
          setError((err as Error).message);
        },
      },
    );
  };

  const handleAssign = (): void => {
    clearFeedback();

    if (!orderToAssign.trim() || !driverId.trim() || !token) {
      setError('ID de pedido e ID de repartidor son obligatorios.');
      return;
    }

    assignOrdersMutation.mutate(
      {
        token,
        orderIds: [orderToAssign.trim()],
        driverId: driverId.trim(),
      },
      {
        onSuccess: () => {
          setOrderToAssign('');
          setMessage('Pedido asignado correctamente.');
        },
        onError: (err) => {
          setError((err as Error).message);
        },
      },
    );
  };

  const summary = useMemo(() => {
    if (!orders) return { total: 0, pendientes: 0, asignados: 0, entregados: 0 };

    return {
      total: orders.length,
      pendientes: orders.filter((order) => order.status === 'PENDIENTE').length,
      asignados: orders.filter((order) => order.status === 'ASIGNADO' || order.status === 'EN_REPARTO').length,
      entregados: orders.filter((order) => order.status === 'ENTREGADO').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const list = [...(orders || [])];

    const filtered = listFilter === 'TODOS' ? list : list.filter((order) => order.status === listFilter);

    return filtered.sort((a, b) => {
      if (a.scheduled_date === b.scheduled_date) return a.address.localeCompare(b.address);
      return a.scheduled_date.localeCompare(b.scheduled_date);
    });
  }, [listFilter, orders]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={refetch} colors={[colors.primary]} />}
    >
      <View style={styles.contentInner}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.title}>Gestion de Pedidos</Text>
            <Text style={styles.subtitle}>Operacion diaria y asignacion de rutas</Text>
          </View>
          <AppButton
            title={showCreate ? 'Ocultar' : 'Nuevo'}
            tone={showCreate ? 'outline' : 'primary'}
            icon={showCreate ? ChevronDown : Plus}
            onPress={() => {
              clearFeedback();
              setShowCreate((current) => !current);
            }}
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
            <Text style={styles.metricLabel}>Pendientes</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: colors.infoLight }]}> 
            <Text style={[styles.metricValue, { color: colors.info }]}>{summary.asignados}</Text>
            <Text style={styles.metricLabel}>Asignados</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: colors.successLight }]}> 
            <Text style={[styles.metricValue, { color: colors.success }]}>{summary.entregados}</Text>
            <Text style={styles.metricLabel}>Entregados</Text>
          </View>
        </View>

        {error || loadError ? (
          <InlineMessage tone="error" text={error || (loadError as Error).message} icon={AlertCircle} />
        ) : null}
        {message ? <InlineMessage tone="success" text={message} /> : null}

        {showCreate ? (
          <Card style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Plus size={17} color={colors.primary} />
              <Text style={styles.sectionTitle}>Crear pedido</Text>
            </View>

            <AppInput
              label="Direccion"
              placeholder="Av. Siempre Viva 742"
              value={address}
              onChangeText={setAddress}
              icon={MapPin}
            />

            <View style={styles.inputGrid}>
              <View style={styles.gridItem}>
                <AppInput label="Zona" value={zone} onChangeText={setZone} />
              </View>
              <View style={styles.gridItem}>
                <AppInput label="Cantidad" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
              </View>
            </View>

            <View style={styles.inputGrid}>
              <View style={styles.gridItem}>
                <AppInput label="Fecha" value={scheduledDate} onChangeText={setScheduledDate} icon={Calendar} />
              </View>
              <View style={styles.gridItem}>
                <AppInput label="Franja" value={timeSlot} onChangeText={setTimeSlot} icon={Clock} />
              </View>
            </View>

            <AppInput label="Notas (opcional)" value={notes} onChangeText={setNotes} multiline />

            <AppButton
              title="Confirmar Pedido"
              onPress={handleCreate}
              loading={createOrderMutation.isPending}
              haptic="success"
              style={{ marginTop: spacing.xs }}
            />
          </Card>
        ) : null}

        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <UserPlus size={17} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Asignacion rapida</Text>
          </View>

          <AppInput
            label="ID del pedido"
            placeholder="Pegá el ID completo"
            value={orderToAssign}
            onChangeText={setOrderToAssign}
          />
          <AppInput
            label="ID del repartidor"
            value={driverId}
            onChangeText={setDriverId}
          />

          <Text style={styles.hintText}>Tip dev: en local suele existir {driverIdSeed} como repartidor seed.</Text>

          <AppButton
            title="Asignar Pedido"
            onPress={handleAssign}
            loading={assignOrdersMutation.isPending}
            tone="secondary"
          />
        </Card>

        <View style={styles.listHeader}>
          <View style={styles.listHeaderMain}>
            <ListFilter size={17} color={colors.textStrong} />
            <Text style={styles.listTitle}>Lista de pedidos</Text>
          </View>
          <Pressable onPress={() => refetch()} style={styles.refreshIcon}>
            <RefreshCw size={16} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {(['TODOS', 'PENDIENTE', 'ASIGNADO', 'ENTREGADO'] as ListFilterType[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setListFilter(item)}
              style={[styles.filterChip, listFilter === item ? styles.filterChipActive : null]}
            >
              <Text style={[styles.filterChipText, listFilter === item ? styles.filterChipTextActive : null]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.skeletonWrap}>
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} style={styles.orderCard}>
                <View style={styles.skeletonTop}>
                  <Skeleton width="68%" height={18} />
                  <Skeleton width={70} height={20} borderRadius={radii.full} />
                </View>
                <Skeleton width="45%" height={13} style={{ marginTop: 8 }} />
                <View style={styles.orderDivider} />
                <Skeleton width="75%" height={12} />
              </Card>
            ))}
          </View>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="No hay pedidos para este filtro"
            description="Cambia el filtro o crea un pedido nuevo para empezar la operacion."
            icon={ClipboardCheck}
          />
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderAddress}>{order.address}</Text>
                  <Text style={styles.metaText}>{order.scheduled_date} • {order.time_slot} • Zona {order.zone}</Text>
                </View>
                <Badge label={order.status} tone={statusTone(order.status)} size="sm" />
              </View>

              <View style={styles.orderDivider} />

              <Text style={styles.orderId}>ID: {order.id}</Text>
              <Text style={styles.assigneeText}>
                {order.assignee_id ? `Repartidor asignado: ${order.assignee_id}` : 'Sin repartidor asignado'}
              </Text>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: layout.screenBottomPadding,
  },
  contentInner: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerMain: {
    flex: 1,
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
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricBox: {
    flexGrow: 1,
    minWidth: '22%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricValue: {
    ...typography.title,
    color: colors.textStrong,
  },
  metricLabel: {
    ...typography.small,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  formCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  gridItem: {
    flex: 1,
  },
  hintText: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  listHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
  refreshIcon: {
    padding: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHighlight,
  },
  filterChipText: {
    ...typography.small,
    color: colors.textBase,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
  skeletonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderCard: {
    padding: spacing.md,
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
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  orderDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  orderId: {
    ...typography.small,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  assigneeText: {
    ...typography.small,
    color: colors.textBase,
    fontWeight: '600',
  },
});

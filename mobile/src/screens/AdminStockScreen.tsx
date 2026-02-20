import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCreateInbound, useDailyReport, useStockSummary } from '../hooks/queries';
import { useAuthStore } from '../store/authStore';
import { colors, layout, radii, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Badge, Card, EmptyState, InlineMessage, Skeleton } from '../ui/primitives';
import { AlertCircle, BarChart3, Calendar, Hash, Package, PlusCircle, RefreshCcw, TrendingUp } from 'lucide-react-native';
import { todayIsoDate } from '../utils/date';

export function AdminStockScreen(): React.JSX.Element {
  const token = useAuthStore((state) => state.token);
  const [date, setDate] = useState(todayIsoDate());
  const [cantidad, setCantidad] = useState('10');

  const {
    data: summary,
    isLoading: isLoadingSummary,
    isRefetching: isRefetchingSummary,
    refetch: refetchSummary,
    error: summaryError,
  } = useStockSummary(token || '');
  const {
    data: report,
    isLoading: isLoadingReport,
    isRefetching: isRefetchingReport,
    refetch: refetchReport,
    error: reportError,
  } = useDailyReport(token || '', date);

  const createInboundMutation = useCreateInbound();

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    setMessage(null);
    void refetchSummary();
    void refetchReport();
  };

  const handleInbound = (): void => {
    setError(null);
    setMessage(null);

    if (!Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0 || !token) {
      setError('La cantidad debe ser un numero mayor a cero.');
      return;
    }

    createInboundMutation.mutate(
      {
        token,
        payload: {
          date,
          cantidad_llenas: Number(cantidad),
        },
      },
      {
        onSuccess: () => {
          setMessage('Ingreso registrado y resumen actualizado.');
        },
        onError: (err) => {
          setError((err as Error).message);
        },
      },
    );
  };

  const isLoading = isLoadingSummary || isLoadingReport;
  const isRefetching = isRefetchingSummary || isRefetchingReport;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={refresh} colors={[colors.primary]} />}
    >
      <View style={styles.contentInner}>
        <View style={styles.header}>
          <Text style={styles.title}>Stock y Balance</Text>
          <Text style={styles.subtitle}>Control del ciclo de garrafas y cierre diario</Text>
        </View>

        {error || summaryError || reportError ? (
          <InlineMessage
            tone="error"
            text={error || (summaryError as Error)?.message || (reportError as Error)?.message}
            icon={AlertCircle}
          />
        ) : null}
        {message ? <InlineMessage tone="success" text={message} icon={PlusCircle} /> : null}

        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Ingreso de proveedor</Text>
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.gridDate}>
              <AppInput label="Fecha" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon={Calendar} />
            </View>
            <View style={styles.gridQty}>
              <AppInput
                label="Llenas"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="number-pad"
                icon={Hash}
              />
            </View>
          </View>

          <View style={styles.actionsRow}>
            <AppButton
              title="Registrar"
              onPress={handleInbound}
              loading={createInboundMutation.isPending}
              style={{ flex: 1 }}
            />
            <AppButton title="Refrescar" tone="outline" icon={RefreshCcw} onPress={refresh} />
          </View>
        </Card>

        {isLoading && !isRefetching ? (
          <View style={styles.summaryContainer}>
            <Skeleton width={140} height={16} style={{ marginBottom: 8 }} />
            <View style={styles.mainStatsRow}>
              <Card style={[styles.statCard, { flex: 1 }]}>
                <Skeleton width="60%" height={12} />
                <Skeleton width="44%" height={28} style={{ marginVertical: 8 }} />
                <Skeleton width="60%" height={10} />
              </Card>
              <Card style={[styles.statCard, { flex: 1 }]}>
                <Skeleton width="60%" height={12} />
                <Skeleton width="44%" height={28} style={{ marginVertical: 8 }} />
                <Skeleton width="60%" height={10} />
              </Card>
            </View>
          </View>
        ) : summary ? (
          <View style={styles.summaryContainer}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={18} color={colors.textStrong} />
              <Text style={styles.sectionHeading}>Estado del Ciclo</Text>
            </View>

            <View style={styles.mainStatsRow}>
              <Card style={[styles.statCard, styles.cardPrimaryAccent]}>
                <Text style={styles.statCardLabel}>Llenas Disponibles</Text>
                <Text style={[styles.statCardValue, { color: colors.primary }]}> {summary.llenas_disponibles_estimadas} </Text>
                <Text style={styles.statCardSub}>En deposito (estimado)</Text>
              </Card>
              <Card
                style={[
                  styles.statCard,
                  summary.pendientes_recuperar > 0 ? styles.cardDangerAccent : styles.cardPrimaryAccent,
                ]}
              >
                <Text style={styles.statCardLabel}>Vacías Pendientes</Text>
                <Text
                  style={[
                    styles.statCardValue,
                    { color: summary.pendientes_recuperar > 0 ? colors.danger : colors.textStrong },
                  ]}
                >
                  {summary.pendientes_recuperar}
                </Text>
                <Text style={styles.statCardSub}>Por recuperar</Text>
              </Card>
            </View>

            <Card style={styles.gridCard}>
              <Text style={styles.gridTitle}>Histórico acumulado</Text>
              <View style={styles.grid}>
                <View style={styles.statTile}>
                  <Text style={styles.statLabel}>Ingresadas</Text>
                  <Text style={styles.statValue}>{summary.llenas_ingresadas}</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statLabel}>Entregadas</Text>
                  <Text style={styles.statValue}>{summary.llenas_entregadas}</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statLabel}>Recibidas</Text>
                  <Text style={styles.statValue}>{summary.vacias_recibidas}</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statLabel}>En deposito</Text>
                  <Text style={styles.statValue}>{summary.vacias_deposito_estimadas}</Text>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        {report ? (
          <Card style={[styles.card, styles.reportCard]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.sectionTitle}>Balance del Día</Text>
                <Text style={styles.metaLabel}>{report.date}</Text>
              </View>
              <Badge label="Hoy" tone="info" size="sm" />
            </View>

            <View style={styles.reportRow}>
              <View style={styles.reportItem}>
                <Text style={styles.reportValue}>{report.entregas_dia}</Text>
                <Text style={styles.reportLabel}>Entregas</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportItem}>
                <Text style={styles.reportValue}>{report.llenas_entregadas}</Text>
                <Text style={styles.reportLabel}>Llenas</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportItem}>
                <Text style={styles.reportValue}>{report.vacias_recibidas}</Text>
                <Text style={styles.reportLabel}>Vacías</Text>
              </View>
            </View>

            {report.pendiente > 0 ? (
              <View style={styles.warningBox}>
                <AlertCircle size={14} color={colors.danger} />
            <Text style={styles.warningText}>Faltan {report.pendiente} vacías para cerrar el día.</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {!isLoading && !summary && !report ? (
          <EmptyState
            title="Sin datos operativos todavia"
            description="Registra un ingreso o refresca para consultar el resumen diario."
            icon={Package}
          />
        ) : null}
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
  sectionHeading: {
    ...typography.section,
    color: colors.textStrong,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridDate: {
    flex: 1.4,
  },
  gridQty: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  summaryContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  mainStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderLeftWidth: 4,
  },
  cardPrimaryAccent: {
    borderLeftColor: colors.primary,
  },
  cardDangerAccent: {
    borderLeftColor: colors.danger,
  },
  statCardLabel: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statCardValue: {
    ...typography.display,
    fontSize: 32,
    lineHeight: 38,
    marginVertical: 4,
  },
  statCardSub: {
    ...typography.small,
    color: colors.textMuted,
  },
  gridCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  gridTitle: {
    ...typography.small,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    width: '48%',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 2,
  },
  statLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.section,
    color: colors.textStrong,
  },
  card: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportCard: {
    backgroundColor: colors.surfaceHighlight,
    borderColor: colors.primaryLight,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  reportItem: {
    alignItems: 'center',
    flex: 1,
  },
  reportValue: {
    ...typography.title,
    color: colors.textStrong,
  },
  reportLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  reportDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.primaryLight,
    opacity: 0.7,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  warningText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
});

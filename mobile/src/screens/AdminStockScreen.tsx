import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { createInbound, dailyReport, stockSummary } from '../api/client';
import { DailyReport, StockSummary } from '../types';
import { colors, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, Chip, EmptyState, InlineMessage, LoadingBlock } from '../ui/primitives';

interface Props {
  token: string;
}

export function AdminStockScreen({ token }: Props): React.JSX.Element {
  const [date, setDate] = useState('2026-02-16');
  const [cantidad, setCantidad] = useState('10');
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInbound, setSavingInbound] = useState(false);

  const refresh = async (showLoader = true): Promise<void> => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      const [s, r] = await Promise.all([stockSummary(token), dailyReport(token, date)]);
      setSummary(s);
      setReport(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void refresh(true);
  }, []);

  const handleInbound = async (): Promise<void> => {
    if (!Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) {
      setError('La cantidad debe ser un número mayor a cero.');
      return;
    }

    try {
      setSavingInbound(true);
      setError(null);
      setMessage(null);
      await createInbound(token, {
        date,
        cantidad_llenas: Number(cantidad),
      });
      setMessage('Ingreso registrado y resumen actualizado.');
      await refresh(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingInbound(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Stock y Reporte Diario</Text>
      <Text style={styles.subtitle}>Control de ciclo llenas/vacías</Text>

      {error ? <InlineMessage tone="error" text={error} /> : null}
      {message ? <InlineMessage tone="success" text={message} /> : null}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Registrar ingreso de proveedor</Text>
        <AppInput label="Fecha" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <AppInput
          label="Cantidad de llenas"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="number-pad"
        />
        <View style={styles.actionsRow}>
          <AppButton title="Registrar" onPress={handleInbound} loading={savingInbound} />
          <AppButton title="Actualizar" tone="ghost" onPress={() => void refresh(true)} />
        </View>
      </Card>

      {loading ? (
        <LoadingBlock label="Actualizando indicadores..." />
      ) : summary ? (
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionHeading}>Estado del Ciclo</Text>
          <View style={styles.mainStatsRow}>
            <Card style={[styles.statCard, { flex: 1, borderColor: colors.primary }]}>
              <Text style={styles.statCardLabel}>Llenas Disponibles</Text>
              <Text style={[styles.statCardValue, { color: colors.primary }]}>
                {summary.llenas_disponibles_estimadas}
              </Text>
              <Text style={styles.statCardSub}>En depósito (est.)</Text>
            </Card>
            <Card style={[styles.statCard, { flex: 1, borderColor: summary.pendientes_recuperar > 0 ? colors.danger : colors.primary }]}>
              <Text style={styles.statCardLabel}>Vacías Pendientes</Text>
              <Text style={[styles.statCardValue, { color: summary.pendientes_recuperar > 0 ? colors.danger : colors.textStrong }]}>
                {summary.pendientes_recuperar}
              </Text>
              <Text style={styles.statCardSub}>Por recuperar</Text>
            </Card>
          </View>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Histórico Acumulado</Text>
            <View style={styles.grid}>
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Llenas Ingresadas</Text>
                <Text style={styles.statValue}>{summary.llenas_ingresadas}</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Llenas Entregadas</Text>
                <Text style={styles.statValue}>{summary.llenas_entregadas}</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Vacías Recibidas</Text>
                <Text style={styles.statValue}>{summary.vacias_recibidas}</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Vacías en Depósito</Text>
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
            <Chip label="Hoy" tone="info" />
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

          {report.pendiente > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Faltan {report.pendiente} vacías para cerrar el día.
              </Text>
            </View>
          )}
        </Card>
      ) : null}

      {!loading && !summary && !report ? (
        <EmptyState
          title="Sin datos operativos todavía"
          description="Registrá un ingreso o refrescá para consultar el resumen del día."
        />
      ) : null}
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
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    color: colors.textStrong,
  },
  sectionHeading: {
    ...typography.section,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  summaryContainer: {
    gap: spacing.sm,
  },
  mainStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderLeftWidth: 4,
  },
  statCardLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statCardValue: {
    ...typography.display,
    fontSize: 36,
    lineHeight: 42,
    marginVertical: 4,
  },
  statCardSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  reportCard: {
    backgroundColor: '#F0F7F4',
    borderColor: '#D1E6DD',
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
    backgroundColor: '#D1E6DD',
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  warningBox: {
    backgroundColor: '#FFF1F0',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#FFD8D6',
  },
  warningText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    gap: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.title,
    color: colors.textStrong,
    fontSize: 20,
  },
  metaLine: {
    ...typography.body,
    color: colors.textMuted,
  },
});

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { createInbound, dailyReport, stockSummary } from '../api/client';
import { DailyReport, StockSummary } from '../types';
import { colors, spacing, typography } from '../theme/tokens';
import { AppButton, AppInput, Card, Chip } from '../ui/primitives';

interface Props {
  token: string;
}

export function AdminStockScreen({ token }: Props): React.JSX.Element {
  const [date, setDate] = useState('2026-02-16');
  const [cantidad, setCantidad] = useState('10');
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    try {
      setError(null);
      const [s, r] = await Promise.all([stockSummary(token), dailyReport(token, date)]);
      setSummary(s);
      setReport(r);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleInbound = async (): Promise<void> => {
    try {
      setError(null);
      await createInbound(token, {
        date,
        cantidad_llenas: Number(cantidad),
      });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stock y Reporte Diario</Text>
      <Text style={styles.subtitle}>Control de ciclo llenas/vacías</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
          <AppButton title="Registrar" onPress={handleInbound} />
          <AppButton title="Actualizar" tone="ghost" onPress={refresh} />
        </View>
      </Card>

      {summary ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Resumen acumulado</Text>
            <Chip label="En línea" tone="success" />
          </View>
          <View style={styles.grid}>
            <View style={styles.statTile}>
              <Text style={styles.statLabel}>Llenas ingresadas</Text>
              <Text style={styles.statValue}>{summary.llenas_ingresadas}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statLabel}>Llenas entregadas</Text>
              <Text style={styles.statValue}>{summary.llenas_entregadas}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statLabel}>Vacías recibidas</Text>
              <Text style={styles.statValue}>{summary.vacias_recibidas}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statLabel}>Pendiente</Text>
              <Text style={styles.statValue}>{summary.pendientes_recuperar}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {report ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Reporte operativo</Text>
            <Chip label={report.date} tone="info" />
          </View>
          <Text style={styles.metaLine}>Entregas del día: {report.entregas_dia}</Text>
          <Text style={styles.metaLine}>Llenas entregadas: {report.llenas_entregadas}</Text>
          <Text style={styles.metaLine}>Vacías recuperadas: {report.vacias_recibidas}</Text>
          <Text style={styles.metaLine}>Pendiente: {report.pendiente}</Text>
        </Card>
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
  error: {
    ...typography.caption,
    color: colors.danger,
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

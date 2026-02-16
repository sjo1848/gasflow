import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { createInbound, dailyReport, stockSummary } from '../api/client';
import { DailyReport, StockSummary } from '../types';

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
    <View style={styles.container}>
      <Text style={styles.title}>Admin • Stock y Reporte</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <TextInput
        style={styles.input}
        value={cantidad}
        onChangeText={setCantidad}
        placeholder="Cantidad llenas"
        keyboardType="number-pad"
      />
      <Button title="Registrar ingreso" onPress={handleInbound} />
      <Button title="Refrescar" onPress={refresh} />

      {summary ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de stock</Text>
          <Text>Llenas ingresadas: {summary.llenas_ingresadas}</Text>
          <Text>Llenas entregadas: {summary.llenas_entregadas}</Text>
          <Text>Vacías recibidas: {summary.vacias_recibidas}</Text>
          <Text>Pendiente: {summary.pendientes_recuperar}</Text>
        </View>
      ) : null}

      {report ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reporte diario ({report.date})</Text>
          <Text>Entregas: {report.entregas_dia}</Text>
          <Text>Llenas: {report.llenas_entregadas}</Text>
          <Text>Vacías: {report.vacias_recibidas}</Text>
          <Text>Pendiente: {report.pendiente}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EEF5ED', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#1D3557' },
  input: {
    borderWidth: 1,
    borderColor: '#BFD8BD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  card: { marginTop: 8, borderWidth: 1, borderColor: '#D0E8D0', borderRadius: 8, padding: 10, backgroundColor: '#FFF' },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
  error: { color: '#B00020' },
});

import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { Role } from '../types';
import { AppMode, availableModes } from '../utils/mode';

interface Props {
  role: Role;
  username: string;
  onSelectMode: (mode: AppMode) => void;
  onLogout: () => void;
}

export function ModeSelectScreen({ role, username, onSelectMode, onLogout }: Props): React.JSX.Element {
  const modes = availableModes(role);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modo de operación</Text>
      <Text style={styles.subtitle}>{username} ({role})</Text>
      {modes.map((mode) => (
        <Button
          key={mode}
          title={mode === 'ADMIN' ? 'Entrar como Admin' : 'Entrar como Repartidor'}
          onPress={() => onSelectMode(mode)}
        />
      ))}
      <View style={styles.separator} />
      <Button title="Cerrar sesión" onPress={onLogout} color="#8A2E2E" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FDFCF8',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#213547',
  },
  subtitle: {
    color: '#576574',
    marginBottom: 8,
  },
  separator: {
    height: 8,
  },
});

import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';

interface Props {
  onSubmit: (username: string, password: string) => Promise<void>;
}

export function LoginScreen({ onSubmit }: Props): React.JSX.Element {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(username.trim(), password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GasFlow</Text>
      <Text style={styles.subtitle}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator /> : <Button title="Ingresar" onPress={handleLogin} />}
      <Text style={styles.hint}>Admin: admin/admin123 | Repartidor: repartidor/repartidor123</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0B3D2E',
  },
  subtitle: {
    fontSize: 18,
    color: '#2F3E46',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CAD2C5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: '#B00020',
  },
  hint: {
    marginTop: 8,
    color: '#555',
    fontSize: 12,
  },
});

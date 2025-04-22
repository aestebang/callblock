import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  NativeModules,
  Alert,
} from 'react-native';

const { CallBlocker } = NativeModules;

export const Settings = () => {
  const [isDefaultDialer, setIsDefaultDialer] = useState(false);

  useEffect(() => {
    checkCallScreeningStatus();
  }, []);

  const checkCallScreeningStatus = async () => {
    try {
      const result = await CallBlocker.isCallScreeningServiceEnabled();
      setIsDefaultDialer(result.enabled);
    } catch (error) {
      console.error('Error checking call screening status:', error);
    }
  };

  const handleSetAsDefault = async () => {
    try {
      const result = await CallBlocker.setAsDefaultDialer('com.callblocking');
      if (result === 'ROLE_REQUEST_LAUNCHED') {
        Alert.alert(
          'Configuración',
          'Por favor, confirma en el diálogo del sistema para establecer la app como identificador de llamadas predeterminado.',
          [{ text: 'OK' }]
        );
        // Verificamos el estado después de un breve retraso para dar tiempo a que el usuario interactúe
        setTimeout(checkCallScreeningStatus, 2000);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo establecer la app como predeterminada. Por favor, inténtalo manualmente desde la configuración del sistema.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        Estado: {isDefaultDialer ? 'App predeterminada' : 'No predeterminada'}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.button,
          isDefaultDialer ? styles.buttonDisabled : styles.buttonEnabled,
        ]}
        onPress={handleSetAsDefault}
        disabled={isDefaultDialer}
      >
        <Text style={styles.buttonText}>
          {isDefaultDialer
            ? 'Ya es la app predeterminada'
            : 'Establecer como app predeterminada'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  status: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
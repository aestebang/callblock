import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  PermissionsAndroid
} from 'react-native';
import CallBlocker from './CallBlocker';

const CallBlockingScreen = () => {
  const [isServiceEnabled, setIsServiceEnabled] = useState(false);
  const [permissions, setPermissions] = useState({
    phoneState: false,
    callLog: false,
    answerCalls: false
  });

  useEffect(() => {
    checkPermissions();
    if (Platform.OS === 'android' && Platform.Version >= 28) {
      checkServiceStatus();
    }
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const phoneState = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
      );
      
      const callLog = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
      );
      
      const answerCalls = Platform.Version >= 26 ? await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS
      ) : false;

      setPermissions({
        phoneState,
        callLog,
        answerCalls: Platform.Version >= 26 ? answerCalls : false
      });
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
        ];
        
        if (Platform.Version >= 26) {
          permissions.push(PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS);
        }
        
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        setPermissions({
          phoneState: granted['android.permission.READ_PHONE_STATE'] === 'granted',
          callLog: granted['android.permission.READ_CALL_LOG'] === 'granted',
          answerCalls: Platform.Version >= 26 
            ? granted['android.permission.ANSWER_PHONE_CALLS'] === 'granted'
            : false
        });
        
        checkServiceStatus();
      } catch (err) {
        console.warn(err);
        Alert.alert('Error', 'No se pudieron solicitar permisos');
      }
    }
  };

  const checkServiceStatus = async () => {
    try {
      const result = await CallBlocker.isCallScreeningServiceEnabled();
      setIsServiceEnabled(result.enabled);
    } catch (error) {
      console.error('Error al verificar el servicio:', error);
    }
  };

  const enableCallBlocking = async () => {
    try {
      await CallBlocker.openCallScreeningSettings();
      // Debemos verificar el estado después de que el usuario regrese
      setTimeout(checkServiceStatus, 1000);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la configuración: ' + error);
    }
  };

  const allPermissionsGranted = permissions.phoneState && permissions.callLog && 
    (Platform.Version < 26 || permissions.answerCalls);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Esta función solo está disponible en dispositivos Android.
        </Text>
      </View>
    );
  }

  if (Platform.Version < 28) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Esta función requiere Android 9 (API nivel 28) o superior.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bloqueo de Llamadas</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Estado del servicio:</Text>
        <Text style={[
          styles.statusValue, 
          isServiceEnabled ? styles.statusEnabled : styles.statusDisabled
        ]}>
          {isServiceEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
        </Text>
      </View>

      <View style={styles.permissionsContainer}>
        <Text style={styles.sectionTitle}>Permisos</Text>
        
        <View style={styles.permissionItem}>
          <Text>Estado del teléfono</Text>
          <Text style={permissions.phoneState ? styles.granted : styles.denied}>
            {permissions.phoneState ? '✓' : '✗'}
          </Text>
        </View>
        
        <View style={styles.permissionItem}>
          <Text>Registro de llamadas</Text>
          <Text style={permissions.callLog ? styles.granted : styles.denied}>
            {permissions.callLog ? '✓' : '✗'}
          </Text>
        </View>
        
        {Platform.Version >= 26 && (
          <View style={styles.permissionItem}>
            <Text>Gestión de llamadas</Text>
            <Text style={permissions.answerCalls ? styles.granted : styles.denied}>
              {permissions.answerCalls ? '✓' : '✗'}
            </Text>
          </View>
        )}
      </View>

      {!allPermissionsGranted && (
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermissions}
        >
          <Text style={styles.buttonText}>Solicitar Permisos</Text>
        </TouchableOpacity>
      )}

      {allPermissionsGranted && (
        <TouchableOpacity 
          style={styles.button} 
          onPress={enableCallBlocking}
        >
          <Text style={styles.buttonText}>
            {isServiceEnabled ? "Configurar Bloqueo" : "Activar Bloqueo"}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.note}>
        Para que el bloqueo de llamadas funcione, debes seleccionar esta aplicación
        como servicio de filtrado de llamadas en la configuración del sistema.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusEnabled: {
    color: 'green',
  },
  statusDisabled: {
    color: 'red',
  },
  permissionsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  granted: {
    color: 'green',
    fontWeight: 'bold',
  },
  denied: {
    color: 'red',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  permissionButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  }
});

export default CallBlockingScreen;
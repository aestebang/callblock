import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  PermissionsAndroid,
  TextInput,
  FlatList,
} from 'react-native';
import CallBlocker from './CallBlocker';

const CallBlockingScreen = () => {
  const [isServiceEnabled, setIsServiceEnabled] = useState(false);
  const [permissions, setPermissions] = useState({
    phoneState: false,
    callLog: false,
    answerCalls: false,
  });
  const [blockedNumbers, setBlockedNumbers] = useState([]);
  const [newNumber, setNewNumber] = useState('');

  useEffect(() => {
    checkPermissions();
    if (Platform.OS === 'android' && Platform.Version >= 28) {
      checkServiceStatus();
      loadBlockedNumbers();
    }
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const phoneState = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      );
      const callLog = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      );
      const answerCalls =
        Platform.Version >= 26
          ? await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
            )
          : false;

      setPermissions({phoneState, callLog, answerCalls});
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        ];
        if (Platform.Version >= 26) {
          permissions.push(PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS);
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        setPermissions({
          phoneState:
            granted['android.permission.READ_PHONE_STATE'] === 'granted',
          callLog: granted['android.permission.READ_CALL_LOG'] === 'granted',
          answerCalls:
            Platform.Version >= 26
              ? granted['android.permission.ANSWER_PHONE_CALLS'] === 'granted'
              : false,
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
      setTimeout(checkServiceStatus, 1000);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la configuración: ' + error);
    }
  };

  const loadBlockedNumbers = async () => {
    try {
      const numbers = await CallBlocker.getBlockedNumbers(); // ← función nativa
      setBlockedNumbers(numbers || []);
    } catch (err) {
      console.error('Error al cargar números bloqueados:', err);
    }
  };

  const addNumberToBlockList = async () => {
    const sanitized = newNumber.trim();
    if (!sanitized || !/^\+?\d+$/.test(sanitized)) {
      Alert.alert('Error', 'Número inválido');
      return;
    }

    try {
      await CallBlocker.addBlockedNumber(sanitized); // ← función nativa
      setNewNumber('');
      loadBlockedNumbers();
    } catch (error) {
      console.error('Error al agregar número:', error);
      Alert.alert('Error', 'No se pudo agregar el número');
    }
  };

  const allPermissionsGranted =
    permissions.phoneState &&
    permissions.callLog &&
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

      {/* Servicio */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Estado del servicio:</Text>
        <Text
          style={[
            styles.statusValue,
            isServiceEnabled ? styles.statusEnabled : styles.statusDisabled,
          ]}>
          {isServiceEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
        </Text>
      </View>

      {/* Permisos */}
      <View style={styles.permissionsContainer}>
        <Text style={styles.sectionTitle}>Permisos</Text>
        {['phoneState', 'callLog', 'answerCalls'].map(
          (key, idx) =>
            (Platform.Version >= 26 || key !== 'answerCalls') && (
              <View key={idx} style={styles.permissionItem}>
                <Text>
                  {
                    {
                      phoneState: 'Estado del teléfono',
                      callLog: 'Registro de llamadas',
                      answerCalls: 'Gestión de llamadas',
                    }[key]
                  }
                </Text>
                <Text style={permissions[key] ? styles.granted : styles.denied}>
                  {permissions[key] ? '✓' : '✗'}
                </Text>
              </View>
            ),
        )}
      </View>

      {/* Botones */}
      {!allPermissionsGranted ? (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}>
          <Text style={styles.buttonText}>Solicitar Permisos</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={enableCallBlocking}>
          <Text style={styles.buttonText}>
            {isServiceEnabled ? 'Configurar Bloqueo' : 'Activar Bloqueo'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Formulario para agregar números */}
      <View style={styles.blockListContainer}>
        <Text style={styles.sectionTitle}>Agregar número a bloquear</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. +123456789"
          keyboardType="phone-pad"
          value={newNumber}
          onChangeText={setNewNumber}
        />
        <TouchableOpacity style={styles.button} onPress={addNumberToBlockList}>
          <Text style={styles.buttonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de números bloqueados */}
      <View style={styles.blockListContainer}>
        <Text style={styles.sectionTitle}>Números bloqueados</Text>
        {blockedNumbers.length === 0 ? (
          <Text style={styles.note}>No hay números bloqueados.</Text>
        ) : (
          <FlatList
            data={blockedNumbers}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <View style={styles.blockedItem}>
                <Text>{item}</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Instrucción manual */}
      <View style={styles.manualPermissionContainer}>
        <Text style={styles.sectionTitle}>Instrucciones Manuales</Text>
        <Text style={styles.note}>
          Si el servicio aún no está activado, abre la configuración de filtrado
          de llamadas y selecciona esta app como predeterminada.
        </Text>
        <TouchableOpacity style={styles.button} onPress={enableCallBlocking}>
          <Text style={styles.buttonText}>Abrir Configuración del Sistema</Text>
        </TouchableOpacity>
      </View>
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
  },
  manualPermissionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  blockListContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  blockedItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});

export default CallBlockingScreen;

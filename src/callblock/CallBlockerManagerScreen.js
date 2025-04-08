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
  ActivityIndicator,
} from 'react-native';
import {CallBlockerService} from './services/CallBlocker';

const CallBlockingScreen = () => {
  const [isServiceEnabled, setIsServiceEnabled] = useState(false);
  const [isDefaultDialer, setIsDefaultDialer] = useState(false);
  const [hasDialerPermission, setHasDialerPermission] = useState(false);
  const [permissions, setPermissions] = useState({
    phoneState: false,
    callLog: false,
    answerCalls: false,
  });
  const [blockedNumbers, setBlockedNumbers] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [loadingBlockedList, setLoadingBlockedList] = useState(false);

  useEffect(() => {
    checkPermissions();
    if (Platform.OS === 'android' && Platform.Version >= 28) {
      checkServiceStatus();
      checkDialerStatus();
      loadBlockedNumbers();
    }
  }, []);

  const checkPermissions = async () => {
    try {
      const phoneStateGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
      const callLogGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALL_LOG);
      const answerCallsGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS);

      setPermissions({
        phoneState: phoneStateGranted,
        callLog: callLogGranted,
        answerCalls: answerCallsGranted,
      });

      if (!phoneStateGranted || !callLogGranted || !answerCallsGranted) {
        await requestPermissions();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
      ]);
      setPermissions({
        phoneState: granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED,
        callLog: granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED,
        answerCalls: granted[PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS] === PermissionsAndroid.RESULTS.GRANTED,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const checkServiceStatus = async () => {
    try {
      const isEnabled = await CallBlockerService.isCallScreeningServiceEnabled();
      setIsServiceEnabled(isEnabled);
    } catch (err) {
      console.warn(err);
    }
  };

  const checkDialerStatus = async () => {
    try {
      const isDefault = await CallBlockerService.setAsDefaultDialer();
      setIsDefaultDialer(isDefault);
      setHasDialerPermission(isDefault);
    } catch (err) {
      console.warn(err);
    }
  };

  const requestDefaultDialer = async () => {
    try {
      await CallBlockerService.setAsDefaultDialer();
      checkDialerStatus();
    } catch (err) {
      console.warn(err);
    }
  };

  const enableCallBlocking = async () => {
    try {
      await CallBlockerService.enableBlocking();
      checkServiceStatus();
    } catch (err) {
      console.warn(err);
    }
  };

  const openCallScreeningSettings = async () => {
    try {
      await CallBlockerService.openCallScreeningSettings();
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'No se pudo abrir la configuración del sistema.');
    }
  };

  const loadBlockedNumbers = async () => {
    setLoadingBlockedList(true);
    try {
      const numbers = await CallBlockerService.getBlockedNumbers();
      setBlockedNumbers(numbers || []);
    } catch (err) {
      console.error('Error al cargar números bloqueados:', err);
    } finally {
      setLoadingBlockedList(false);
    }
  };

  const addNumberToBlockList = async () => {
    const sanitized = newNumber.trim();
    if (!sanitized || !/^\+?\d+$/.test(sanitized)) {
      Alert.alert('Error', 'Número inválido');
      return;
    }
    if (blockedNumbers.includes(sanitized)) {
      Alert.alert('Error', 'Este número ya está bloqueado');
      return;
    }

    try {
      const updatedList = [...blockedNumbers, sanitized];
      await CallBlockerService.setBlockedNumbers(updatedList);
      setNewNumber('');
      loadBlockedNumbers();
    } catch (error) {
      console.error('Error al agregar número:', error);
      Alert.alert('Error', 'No se pudo agregar el número');
    }
  };

  const removeBlockedNumber = async number => {
    try {
      await CallBlockerService.removeBlockedNumber(number);
      loadBlockedNumbers();
    } catch (error) {
      console.error('Error al eliminar número:', error);
      Alert.alert('Error', 'No se pudo eliminar el número');
    }
  };

  if (Platform.OS !== 'android' || Platform.Version < 28) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bloqueo de llamadas</Text>
        <Text style={styles.note}>Disponible solo para Android 9 (Pie) o superior.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bloqueo de llamadas</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estado del servicio</Text>
        <Text style={styles.statusText}>
          {isServiceEnabled ? '✅ Habilitado' : '❌ Deshabilitado'}
        </Text>
        {!isServiceEnabled && (
          <>
            <TouchableOpacity style={styles.button} onPress={enableCallBlocking}>
              <Text style={styles.buttonText}>Habilitar bloqueo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: '#FF9800'}]}
              onPress={openCallScreeningSettings}>
              <Text style={styles.buttonText}>Abrir ajustes del sistema</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Marcador predeterminado</Text>
        <Text>📱 Predeterminado: {isDefaultDialer ? '✅' : '❌'}</Text>
        <Text>🔐 Permiso: {hasDialerPermission ? '✅' : '❌'}</Text>
        {!isDefaultDialer && (
          <TouchableOpacity style={styles.button} onPress={requestDefaultDialer}>
            <Text style={styles.buttonText}>Establecer como marcador</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Permisos</Text>
        <Text>📞 Estado del teléfono: {permissions.phoneState ? '✅' : '❌'}</Text>
        <Text>📋 Registro llamadas: {permissions.callLog ? '✅' : '❌'}</Text>
        <Text>📲 Contestar llamadas: {permissions.answerCalls ? '✅' : '❌'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Agregar número a bloquear</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ej: +123456789"
            keyboardType="phone-pad"
            value={newNumber}
            onChangeText={setNewNumber}
          />
          <TouchableOpacity
            style={[styles.addButton, {opacity: newNumber.trim() ? 1 : 0.5}]}
            onPress={addNumberToBlockList}
            disabled={!newNumber.trim()}>
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Números bloqueados</Text>
        {loadingBlockedList ? (
          <ActivityIndicator size="small" color="#6200EE" />
        ) : blockedNumbers.length === 0 ? (
          <Text style={styles.note}>No hay números bloqueados.</Text>
        ) : (
          <FlatList
            data={blockedNumbers}
            keyExtractor={(item, index) => index.toString()}
            initialNumToRender={5}
            renderItem={({item}) => (
              <View style={styles.blockedItemRow}>
                <Text style={styles.blockedNumberText}>{item}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeBlockedNumber(item)}>
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6200EE',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#6200EE',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  note: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fafafa',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#03DAC6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  blockedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  blockedNumberText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#B00020',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CallBlockingScreen;

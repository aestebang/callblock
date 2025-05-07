import React, {useState, useEffect, useCallback} from 'react';
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
  Modal,
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
  const [availableApps, setAvailableApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);

  console.log('permiso', permissions);

  useEffect(() => {
    checkPermissions();
    if (Platform.OS === 'android' && Platform.Version >= 28) {
      checkServiceStatus();
      checkDialerStatus();
      loadBlockedNumbers();
      loadAvailableApps();
    }
  }, [checkPermissions]);

  const checkPermissions = useCallback(async () => {
    try {
      const phoneStateGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      );
      const callLogGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      );
      const answerCallsGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
      );

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
  }, []);

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
      ]);
      setPermissions({
        phoneState:
          granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] ===
          PermissionsAndroid.RESULTS.GRANTED,
        callLog:
          granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] ===
          PermissionsAndroid.RESULTS.GRANTED,
        answerCalls:
          granted[PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS] ===
          PermissionsAndroid.RESULTS.GRANTED,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const checkServiceStatus = async () => {
    try {
      const result = await CallBlockerService.isCallScreeningServiceEnabled();
      setIsServiceEnabled(result.enabled);
      if (result.enabled) {
        Alert.alert(
          'Éxito',
          'El servicio de identificación de llamadas ha sido habilitado correctamente.',
          [{text: 'OK'}],
        );
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const checkDialerStatus = async () => {
    try {
      const result = await CallBlockerService.isCallScreeningServiceEnabled();
      setIsDefaultDialer(result.enabled);
      setHasDialerPermission(result.enabled);
    } catch (err) {
      console.warn(err);
    }
  };

  const requestDefaultDialer = async packageName => {
    console.log('Requesting default dialer:', packageName);

    try {
      await CallBlockerService.setAsDefaultDialer(packageName);
      // El diálogo de selección se mostrará automáticamente
      // y el sistema manejará la selección del usuario
      setTimeout(checkServiceStatus, 2000);
    } catch (err) {
      console.warn(err);
      Alert.alert(
        'Error',
        'No se pudo mostrar las opciones de configuración.',
        [{text: 'OK'}],
      );
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
      // Verificamos el estado después de un breve retraso
      setTimeout(checkServiceStatus, 2000);
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

  const loadAvailableApps = async () => {
    setLoadingApps(true);
    try {
      const apps = await CallBlockerService.getAvailableCallBlockingApps();
      setAvailableApps(apps || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingApps(false);
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

  const renderAppSelector = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAppSelector}
        onRequestClose={() => setShowAppSelector(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Seleccionar App de ID de llamada
            </Text>
            {loadingApps ? (
              <ActivityIndicator size="large" color="#2196F3" />
            ) : (
              <FlatList
                data={availableApps}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.appSelectorItem}
                    onPress={() => {
                      setShowAppSelector(false);
                      requestDefaultDialer(item.packageName);
                    }}>
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{item.appName}</Text>
                      {item.isDefault && (
                        <Text style={styles.defaultLabel}>Predeterminada</Text>
                      )}
                    </View>
                    <View style={styles.appActions}>
                      {item.packageName === 'com.callblocking' && (
                        <TouchableOpacity
                          style={[
                            styles.selectButton,
                            item.isDefault && styles.selectButtonDisabled,
                          ]}
                          disabled={item.isDefault}
                          onPress={() => {
                            setShowAppSelector(false);
                            requestDefaultDialer(item.packageName);
                          }}>
                          <Text style={styles.selectButtonText}>
                            {item.isDefault ? 'Actual' : 'Seleccionar'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAppSelector(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAvailableApps = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>App de ID de llamada</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            loadAvailableApps();
            setShowAppSelector(true);
          }}>
          <Text style={styles.buttonText}>
            Seleccionar App de ID de llamada
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (Platform.OS !== 'android' || Platform.Version < 28) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bloqueo de llamadas</Text>
        <Text style={styles.note}>
          Disponible solo para Android 9 (Pie) o superior.
        </Text>
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
            <TouchableOpacity
              style={styles.button}
              onPress={enableCallBlocking}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración de la Aplicación</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Estado:{' '}
            {isDefaultDialer ? 'App predeterminada' : 'No predeterminada'}
          </Text>
          <TouchableOpacity
            style={[
              styles.button,
              isDefaultDialer ? styles.buttonDisabled : styles.buttonPrimary,
            ]}
            onPress={() => requestDefaultDialer('com.callblocking')}
            disabled={isDefaultDialer}>
            <Text style={styles.buttonText}>
              {isDefaultDialer
                ? 'Ya es la app predeterminada'
                : 'Establecer como app predeterminada'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Permisos</Text>
        <Text>
          📞 Estado del teléfono: {permissions.phoneState ? '✅' : '❌'}
        </Text>
        <Text>📋 Registro llamadas: {permissions.callLog ? '✅' : '❌'}</Text>
        <Text>
          📲 Contestar llamadas: {permissions.answerCalls ? '✅' : '❌'}
        </Text>
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

      {renderAvailableApps()}
      {renderAppSelector()}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  appSelectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    color: '#333',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
  },
  appActions: {
    marginLeft: 10,
  },
  selectButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectButtonDisabled: {
    backgroundColor: '#ccc',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusContainer: {
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default CallBlockingScreen;

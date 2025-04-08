// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   StyleSheet,
//   Alert
// } from 'react-native';
// import CallBlocker from './CallBlocker';

// const CallBlockerManagerScreen = () => {
//   const [number, setNumber] = useState('');
//   const [blockedNumbers, setBlockedNumbers] = useState([]);

//   const addNumber = () => {
//     const trimmed = number.trim();
//     if (trimmed && !blockedNumbers.includes(trimmed)) {
//       setBlockedNumbers([...blockedNumbers, trimmed]);
//       setNumber('');
//     } else {
//       Alert.alert('Aviso', 'El número ya está en la lista o es inválido');
//     }
//   };

//   const removeNumber = (toRemove) => {
//     setBlockedNumbers(blockedNumbers.filter(n => n !== toRemove));
//   };

//   const saveList = () => {
//     CallBlocker.setBlockedNumbers(blockedNumbers);
//     Alert.alert('Éxito', 'Lista de números bloqueados actualizada');
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Gestor de Números Bloqueados</Text>

//       <View style={styles.inputContainer}>
//         <TextInput
//           style={styles.input}
//           placeholder="Ingresa un número"
//           value={number}
//           onChangeText={setNumber}
//           keyboardType="phone-pad"
//         />
//         <TouchableOpacity style={styles.addButton} onPress={addNumber}>
//           <Text style={styles.buttonText}>Agregar</Text>
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={blockedNumbers}
//         keyExtractor={(item) => item}
//         ListEmptyComponent={<Text style={styles.empty}>No hay números bloqueados.</Text>}
//         renderItem={({ item }) => (
//           <View style={styles.listItem}>
//             <Text style={styles.number}>{item}</Text>
//             <TouchableOpacity onPress={() => removeNumber(item)}>
//               <Text style={styles.remove}>Eliminar</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       />

//       <TouchableOpacity style={styles.saveButton} onPress={saveList}>
//         <Text style={styles.buttonText}>Guardar Lista</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     marginBottom: 15,
//   },
//   input: {
//     flex: 1,
//     borderColor: '#999',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     height: 45,
//   },
//   addButton: {
//     backgroundColor: '#4CAF50',
//     paddingHorizontal: 15,
//     justifyContent: 'center',
//     borderRadius: 8,
//     marginLeft: 10,
//   },
//   listItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   number: {
//     fontSize: 16,
//   },
//   remove: {
//     color: 'red',
//     fontWeight: 'bold',
//   },
//   saveButton: {
//     marginTop: 20,
//     backgroundColor: '#2196F3',
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   empty: {
//     textAlign: 'center',
//     color: '#666',
//     marginTop: 10,
//   }
// });

// export default CallBlockerManagerScreen;
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

      <View style={styles.manualPermissionContainer}>
        <Text style={styles.sectionTitle}>Instrucciones Manuales</Text>
        <Text style={styles.note}>
          Si el servicio aún no está activado, abre la configuración de filtrado de llamadas y selecciona esta app como predeterminada.
        </Text>
        <TouchableOpacity style={styles.button} onPress={enableCallBlocking}>
          <Text style={styles.buttonText}>Abrir Configuración del Sistema</Text>
        </TouchableOpacity>
      </View>

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
  },
  manualPermissionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});

export default CallBlockingScreen;

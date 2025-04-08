import { NativeModules, Platform } from 'react-native';

const { CallBlocker } = NativeModules;

export default {
  /**
   * Abre la configuración del sistema para habilitar el servicio de filtrado de llamadas.
   * El usuario deberá habilitar manualmente el servicio.
   * @returns {Promise<boolean>} - Promesa que se resuelve cuando se abre la configuración
   */
  openCallScreeningSettings: () => {
    if (Platform.OS === 'android' && Platform.Version >= 28) {
      return CallBlocker.openCallScreeningSettings();
    }
    return Promise.reject('Esta función solo está disponible en Android 9+');
  },

  /**
   * Verifica si el servicio de filtrado de llamadas está habilitado.
   * @returns {Promise<{enabled: boolean}>} - Promesa que se resuelve con el estado del servicio
   */
  isCallScreeningServiceEnabled: () => {
    if (Platform.OS === 'android' && Platform.Version >= 28) {
      return CallBlocker.isCallScreeningServiceEnabled();
    }
    return Promise.reject('Esta función solo está disponible en Android 9+');
  }
};

// import SharedPreferences from 'react-native-shared-preferences';

// const BLOCKED_NUMBERS_KEY = 'blockedNumbers';

// const CallBlocker = {
//   /**
//    * Guarda la lista de números bloqueados en SharedPreferences.
//    * @param {string[]} numbers - Lista de números a bloquear.
//    */
//   setBlockedNumbers: (numbers) => {
//     const json = JSON.stringify(numbers);
//     SharedPreferences.setItem(BLOCKED_NUMBERS_KEY, json);
//   },

//   /**
//    * Obtiene la lista de números bloqueados desde SharedPreferences.
//    * @returns {Promise<string[]>} Lista de números bloqueados.
//    */
//   getBlockedNumbers: () => {
//     return new Promise((resolve, reject) => {
//       SharedPreferences.getItem(BLOCKED_NUMBERS_KEY, (value) => {
//         try {
//           if (value) {
//             const parsed = JSON.parse(value);
//             resolve(parsed || []);
//           } else {
//             resolve([]);
//           }
//         } catch (error) {
//           reject(error);
//         }
//       });
//     });
//   },

//   /**
//    * Verifica si un número está en la lista de bloqueados.
//    * @param {string} number - Número a verificar.
//    * @returns {Promise<boolean>}
//    */
//   isNumberBlocked: async (number) => {
//     const numbers = await CallBlocker.getBlockedNumbers();
//     return numbers.includes(number);
//   }
// };

// export default CallBlocker;

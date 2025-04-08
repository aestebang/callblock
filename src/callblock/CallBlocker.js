import { NativeModules, Platform } from 'react-native';

const { CallBlocker } = NativeModules;

if (!CallBlocker) {
  console.warn('[CallBlocker] El módulo nativo no está vinculado correctamente.');
}

const isSupported = Platform.OS === 'android' && Platform.Version >= 28;

const CallBlockerModule = {
  /**
   * Abre la configuración del sistema para habilitar el servicio de filtrado de llamadas.
   * @returns {Promise<void>}
   */
  openCallScreeningSettings: () => {
    if (!isSupported) {
      return Promise.reject(
        '[CallBlocker] Esta función solo está disponible en Android 9+ (API 28+)'
      );
    }

    if (typeof CallBlocker?.openCallScreeningSettings !== 'function') {
      return Promise.reject('[CallBlocker] Método openCallScreeningSettings no está definido');
    }

    return CallBlocker.openCallScreeningSettings();
  },

  /**
   * Verifica si el servicio de filtrado de llamadas está habilitado.
   * @returns {Promise<{ enabled: boolean }>}
   */
  isCallScreeningServiceEnabled: () => {
    if (!isSupported) {
      return Promise.reject(
        '[CallBlocker] Esta función solo está disponible en Android 9+ (API 28+)'
      );
    }

    if (typeof CallBlocker?.isCallScreeningServiceEnabled !== 'function') {
      return Promise.reject('[CallBlocker] Método isCallScreeningServiceEnabled no está definido');
    }

    return CallBlocker.isCallScreeningServiceEnabled();
  },
};

export default CallBlockerModule;

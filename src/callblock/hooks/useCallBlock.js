import {NativeModules, Platform} from 'react-native';
const {CallBlocker} = NativeModules;
const isAndroid = Platform.OS === 'android';

const useCallBlock = () => {
  const setBlockedNumbers = async (numbers = []) => {
    if (!isAndroid) return;
    try {
      await CallBlocker.setBlockedNumbers(numbers);
      console.log('Números bloqueados actualizados:', numbers);
    } catch (error) {
      console.error('Error al guardar números bloqueados:', error);
    }
  };

  const isCallScreeningServiceEnabled = async () => {
    if (!isAndroid) return false;
    try {
      const {enabled} = await CallBlocker.isCallScreeningServiceEnabled();
      console.log('¿Servicio de bloqueo activo?:', enabled);
      return enabled;
    } catch (error) {
      console.error(
        'Error al verificar si el servicio está habilitado:',
        error,
      );
      return false;
    }
  };

  const openCallScreeningSettings = async () => {
    if (!isAndroid) return;
    try {
      await CallBlocker.openCallScreeningSettings();
    } catch (error) {
      console.error('No se pudo abrir los ajustes del sistema:', error);
    }
  };

  const enableBlocking = async () => {
    if (!isAndroid) return;
    try {
      await CallBlocker.enableBlocking();
      console.log('Bloqueo activado correctamente');
    } catch (error) {
      console.error('Error al activar el bloqueo:', error);
    }
  };

  const removeBlockedNumber = async number => {
    if (!isAndroid) return;
    try {
      const {removed} = await CallBlocker.removeBlockedNumber(number);
      console.log(`¿Número eliminado?:`, removed);
      return removed;
    } catch (error) {
      console.error('Error al eliminar número bloqueado:', error);
      return false;
    }
  };

  const getBlockedNumbers = async () => {
    if (!isAndroid) return [];
    try {
      const blockedNumbers = await CallBlocker.getBlockedNumbers();
      console.log('Números actualmente bloqueados:', blockedNumbers);
      return blockedNumbers;
    } catch (error) {
      console.error('Error al obtener números bloqueados:', error);
      return [];
    }
  };

  /** NUEVA FUNCIÓN */
  const setAsDefaultDialer = async packageName => {
    if (!isAndroid) return;
    try {
      // Si no se proporciona packageName, usar el de nuestra app
      const pkgName = packageName || 'com.callblocking';
      const result = await CallBlocker.setAsDefaultDialer(pkgName);
      console.log('Resultado al intentar ser dialer predeterminado:', result);
      return result;
    } catch (error) {
      console.error('Error al intentar establecer app como dialer:', error);
      throw error;
    }
  };

  const getAvailableCallBlockingApps = async () => {
    if (!isAndroid) return [];
    try {
      const apps = await CallBlocker.getAvailableCallBlockingApps();
      console.log('Aplicaciones disponibles para bloqueo de llamadas:', apps);
      return apps;
    } catch (error) {
      console.error('Error al obtener aplicaciones de bloqueo:', error);
      return [];
    }
  };

  return {
    setBlockedNumbers,
    isCallScreeningServiceEnabled,
    openCallScreeningSettings,
    enableBlocking,
    removeBlockedNumber,
    getBlockedNumbers,
    setAsDefaultDialer,
    getAvailableCallBlockingApps
  };
};

export default useCallBlock;

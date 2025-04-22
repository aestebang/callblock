declare module 'react-native' {
  interface NativeModulesStatic {
    CallBlocker: {
      setAsDefaultDialer(packageName: string): Promise<string>;
      isCallScreeningServiceEnabled(): Promise<{ enabled: boolean }>;
      openCallScreeningSettings(): Promise<void>;
    };
  }
} 
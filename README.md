# Call Blocking App

Aplicación móvil multiplataforma para el bloqueo de llamadas no deseadas, desarrollada con React Native y módulos nativos en Swift (iOS) y Kotlin (Android).

## 🎯 Objetivo

Esta aplicación permite a los usuarios bloquear llamadas no deseadas de manera efectiva, utilizando las capacidades nativas de los sistemas operativos iOS (CallKit) y Android (Call Screening Service). La aplicación proporciona una interfaz unificada para gestionar números bloqueados y ofrece funcionalidades avanzadas de bloqueo de llamadas en ambas plataformas.

## 🛠 Arquitectura y Tecnologías

### Frontend

- **React Native**: Framework principal para el desarrollo de la aplicación móvil
- **JavaScript/TypeScript**: Lenguaje de programación principal
- **React Hooks**: Para el manejo del estado y efectos en la aplicación
- **Redux/Context API**: Gestión del estado global de la aplicación

### Módulos Nativos

#### iOS (Swift)

- **CallKit**: Framework nativo para el manejo de llamadas
- **UserDefaults**: Persistencia de datos local
- **Swift**: Implementación de funcionalidades nativas

#### Android (Kotlin)

- **Call Screening Service**: API nativa para el manejo de llamadas
- **Room Database**: Persistencia de datos local
- **Kotlin Coroutines**: Manejo de operaciones asíncronas
- **WorkManager**: Programación de tareas en segundo plano

## 📱 Características Principales

### Funcionalidades Comunes

- Bloqueo de números de teléfono individuales
- Bloqueo masivo de números
- Persistencia de números bloqueados
- Interfaz de usuario intuitiva y unificada
- Sincronización de números bloqueados entre plataformas

### Características Específicas por Plataforma

#### iOS

- Integración nativa con CallKit
- Bloqueo a nivel del sistema
- Notificaciones de llamadas bloqueadas
- Soporte para extensiones de bloqueo de llamadas

#### Android

- Integración con Call Screening Service
- Bloqueo a nivel del sistema
- Gestión de permisos de llamada
- Soporte para modo no molestar

## 🔧 Implementación Técnica

### Módulo iOS (Swift)

```swift
@objc(CallBlocking)
class CallBlocking: NSObject {
    private var blockedNumbers: Set<String> = []
    private let userDefaults = UserDefaults.standard

    // Métodos principales
    @objc func blockNumber(_ phoneNumber: String, callback: @escaping (Bool) -> Void)
    @objc func unblockNumber(_ phoneNumber: String, callback: @escaping (Bool) -> Void)
    @objc func blockNumbers(_ phoneNumbers: [String], callback: @escaping (Bool) -> Void)
}
```

### Módulo Android (Kotlin)

```kotlin
class CallBlockerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val callBlockerService: CallBlockerService
    private val blockedNumbersDao: BlockedNumbersDao

    // Métodos principales
    @ReactMethod
    fun blockNumber(phoneNumber: String, promise: Promise)

    @ReactMethod
    fun unblockNumber(phoneNumber: String, promise: Promise)

    @ReactMethod
    fun blockNumbers(phoneNumbers: ReadableArray, promise: Promise)
}
```

## 💾 Persistencia de Datos

### iOS

```swift
private func saveBlockedNumbers() {
    userDefaults.set(Array(blockedNumbers), forKey: blockedNumbersKey)
}

private func loadBlockedNumbers() {
    if let savedNumbers = userDefaults.stringArray(forKey: blockedNumbersKey) {
        blockedNumbers = Set(savedNumbers)
    }
}
```

### Android

```kotlin
@Entity(tableName = "blocked_numbers")
data class BlockedNumber(
    @PrimaryKey val phoneNumber: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Dao
interface BlockedNumbersDao {
    @Query("SELECT * FROM blocked_numbers")
    suspend fun getAllBlockedNumbers(): List<BlockedNumber>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBlockedNumber(number: BlockedNumber)

    @Delete
    suspend fun deleteBlockedNumber(number: BlockedNumber)
}
```

## 🔒 Integración con el Sistema

### iOS (CallKit)

```swift
private func updateBlockedNumbers() {
    let provider = CXCallDirectoryProvider()
    let context = CXCallDirectoryExtensionContext()

    for number in blockedNumbers {
        if let numberInt = Int64(number) {
            context.addBlockingEntry(withNextSequentialPhoneNumber: numberInt)
        }
    }

    context.completeRequest { error in
        if let error = error {
            print("Error updating blocked numbers: \(error.localizedDescription)")
        }
    }
}
```

### Android (Call Screening Service)

```kotlin
class CallBlockerService : CallScreeningService() {
    override fun onScreenCall(callDetails: Call.Details) {
        val response = CallResponse.Builder()

        if (isNumberBlocked(callDetails.handle.schemeSpecificPart)) {
            response.setRejectCall(true)
                .setDisallowCall(true)
                .setSkipCallLog(false)
                .setSkipNotification(false)
        }

        respondToCall(callDetails, response.build())
    }
}
```

## 🚀 Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
# o
yarn install
```

3. Configuración específica por plataforma:

### iOS

```bash
cd ios
pod install
cd ..
```

### Android

```bash
# Asegúrate de tener el SDK de Android instalado
# Configura las variables de entorno ANDROID_HOME y JAVA_HOME
```

4. Ejecuta la aplicación:

```bash
# Para iOS
npm run ios
# o
yarn ios

# Para Android
npm run android
# o
yarn android
```

## 📝 Requisitos del Sistema

### iOS

- iOS 10.0 o superior
- Xcode 12.0 o superior
- CocoaPods

### Android

- Android 9.0 (API 28) o superior
- Android Studio 4.0 o superior
- JDK 11 o superior

## 🔐 Permisos Requeridos

### iOS

- Permisos de llamada
- Acceso a contactos (opcional)

### Android

- READ_PHONE_STATE
- READ_CALL_LOG
- ANSWER_PHONE_CALLS
- MODIFY_PHONE_STATE

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, asegúrate de:

1. Hacer fork del proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

package com.callblocking.callblock

import android.content.Intent
import android.os.Build
import android.preference.PreferenceManager
import android.provider.Settings
import com.facebook.react.bridge.*
import android.telecom.TelecomManager
import android.net.Uri


class CallBlockerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "CallBlocker"
    }

    // @ReactMethod
    // fun openCallScreeningSettings(promise: Promise) {
    //     try {
    //         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    //             val intent = Intent("android.settings.CALL_SCREENING_SETTINGS")
    //             intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    //             reactContext.startActivity(intent)
    //             promise.resolve(true)
    //         } else {
    //             promise.reject("UNSUPPORTED_VERSION", "Esta función solo está disponible en Android 10 o superior.")
    //         }
    //     } catch (e: Exception) {
    //         promise.reject("ERROR", "No se pudo abrir la configuración de bloqueo de llamadas: ${e.message}")
    //     }
    // }
    @ReactMethod
    fun openCallScreeningSettings(promise: Promise) {
    try {
        val context = reactApplicationContext
        val intent = Intent("android.settings.CALL_SCREENING_SETTINGS")

        if (intent.resolveActivity(context.packageManager) != null) {
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            promise.resolve(null)
        } else {
            // Fallback: configuración de la app
            val fallbackIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            fallbackIntent.data = Uri.parse("package:${context.packageName}")
            fallbackIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(fallbackIntent)
            promise.resolve(null)
        }
    } catch (e: Exception) {
        promise.reject("OPEN_SETTINGS_ERROR", "No se pudo abrir la configuración de bloqueo de llamadas", e)
    }
}



    @ReactMethod
    fun setBlockedNumbers(numbers: ReadableArray) {
        val prefs = PreferenceManager.getDefaultSharedPreferences(reactApplicationContext)
        val set = numbers.toArrayList().map { it.toString() }.toSet()
        prefs.edit().putStringSet("blocked_numbers", set).apply()
    }

    @ReactMethod
    fun isCallScreeningServiceEnabled(promise: Promise) {
        val packageName = reactContext.packageName
        val callScreeningService = "$packageName.callblock.CallScreener"
        val callScreeningSetting = Settings.Secure.getString(
            reactContext.contentResolver,
            "call_screening_service"
        )

        val result = Arguments.createMap()
        val isEnabled = callScreeningSetting?.contains(callScreeningService) ?: false
        result.putBoolean("enabled", isEnabled)
        promise.resolve(result)
    }

    @ReactMethod
   fun enableBlocking(promise: Promise) {
    try {
        val prefs = PreferenceManager.getDefaultSharedPreferences(reactApplicationContext)
        prefs.edit().putBoolean("blocking_enabled", true).apply()
        promise.resolve(true)
    } catch (e: Exception) {
        promise.reject("ENABLE_BLOCKING_FAILED", e.message)
    }
}

  @ReactMethod
    fun removeBlockedNumber(number: String, promise: Promise) {   
    try {
        val prefs = PreferenceManager.getDefaultSharedPreferences(reactApplicationContext)
        val currentSet = prefs.getStringSet("blocked_numbers", mutableSetOf())?.toMutableSet() ?: mutableSetOf()

        val removed = currentSet.remove(number)
        prefs.edit().putStringSet("blocked_numbers", currentSet).apply()

        val result = Arguments.createMap()
        result.putBoolean("removed", removed)
        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("REMOVE_FAILED", "Error al remover número: ${e.message}")
    }
}
@ReactMethod
fun getBlockedNumbers(promise: Promise) {
    try {
        val prefs = PreferenceManager.getDefaultSharedPreferences(reactApplicationContext)
        val set = prefs.getStringSet("blocked_numbers", emptySet()) ?: emptySet()
        val result = Arguments.fromArray(set.toTypedArray())
        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("GET_FAILED", "Error al obtener números bloqueados: ${e.message}")
    }
}

@ReactMethod
fun setAsDefaultDialer(promise: Promise) {
    try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val context = reactApplicationContext
            val intent = Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER)
            intent.putExtra(
                TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME,
                context.packageName
            )
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            promise.resolve("Intent launched")
        } else {
            promise.reject("UNSUPPORTED_VERSION", "Requires Android 10 or higher")
        }
    } catch (e: Exception) {
        promise.reject("ERROR_SETTING_DIALER", e.message, e)
    }
}

}

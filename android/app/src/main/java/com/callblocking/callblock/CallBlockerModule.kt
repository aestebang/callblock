package com.callblocking.callblock

import android.content.Intent
import android.os.Build
import android.preference.PreferenceManager
import android.provider.Settings
import com.facebook.react.bridge.*

class CallBlockerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "CallBlocker"
    }

    @ReactMethod
    fun openCallScreeningSettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val intent = Intent("android.settings.CALL_SCREENING_SETTINGS")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.reject("UNSUPPORTED_VERSION", "Esta función solo está disponible en Android 10 o superior.")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "No se pudo abrir la configuración de bloqueo de llamadas: ${e.message}")
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
}

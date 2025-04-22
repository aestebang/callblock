package com.callblocking.callblock

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.preference.PreferenceManager
import android.provider.Settings
import com.facebook.react.bridge.*
import android.telecom.TelecomManager
import android.net.Uri
import android.content.Context
import android.util.Log
import android.content.pm.PackageManager
import android.app.role.RoleManager
import android.app.Activity
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.callblocking.callblock.PreferenceKeys
import android.content.ActivityNotFoundException

class CallBlockerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), PermissionListener {

    override fun getName(): String {
        return "CallBlocker"
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray): Boolean {
        return true
    }

    @ReactMethod
    fun openCallScreeningSettings(promise: Promise) {
        try {
            val intent = Intent("android.settings.CALL_SCREENING_SETTINGS")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                reactApplicationContext.startActivity(intent)
                promise.resolve(null)
            } catch (e: ActivityNotFoundException) {
                // If call screening settings are not available, open app settings instead
                val appSettingsIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                val uri = Uri.fromParts("package", reactApplicationContext.packageName, null)
                appSettingsIntent.data = uri
                appSettingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(appSettingsIntent)
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setBlockedNumbers(numbers: ReadableArray, promise: Promise) {
        try {
            val sharedPreferences = PreferenceManager.getDefaultSharedPreferences(reactApplicationContext)
            val editor = sharedPreferences.edit()
            val numbersSet = mutableSetOf<String>()
            for (i in 0 until numbers.size()) {
                numbers.getString(i)?.let { number ->
                    numbersSet.add(number)
                }
            }
            editor.putStringSet(PreferenceKeys.BLOCKED_NUMBERS, numbersSet)
            editor.apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isCallScreeningServiceEnabled(promise: Promise) {
        val packageName = reactApplicationContext.packageName
        val callScreeningService = "$packageName.callblock.CallScreener"
        val callScreeningSetting = Settings.Secure.getString(
            reactApplicationContext.contentResolver,
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
            prefs.edit().putBoolean(PreferenceKeys.BLOCKING_ENABLED, true).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ENABLE_BLOCKING_FAILED", e.message)
        }
    }

    @ReactMethod
    fun removeBlockedNumber(number: String, promise: Promise) {   
        try {
            val prefs = PreferenceManager.getDefaultSharedPreferences(reactApplicationContext)
            val currentSet: MutableSet<String> = prefs.getStringSet(PreferenceKeys.BLOCKED_NUMBERS, mutableSetOf())?.toMutableSet() ?: mutableSetOf()

            val removed = currentSet.remove(number)
            prefs.edit().putStringSet(PreferenceKeys.BLOCKED_NUMBERS, currentSet).apply()

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
            val sharedPreferences = PreferenceManager.getDefaultSharedPreferences(reactApplicationContext)
            val blockedNumbers = sharedPreferences.getStringSet(PreferenceKeys.BLOCKED_NUMBERS, emptySet())
            val result = Arguments.createArray()
            blockedNumbers?.forEach { number ->
                result.pushString(number)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getAvailableCallBlockingApps(promise: Promise) {
        try {
            val roleManager = reactApplicationContext.getSystemService(Context.ROLE_SERVICE) as RoleManager
            val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
            val resolveInfos = reactApplicationContext.packageManager.queryIntentActivities(intent, 0)
            val result = Arguments.createArray()
            
            resolveInfos.forEach { resolveInfo ->
                val map = Arguments.createMap()
                map.putString("packageName", resolveInfo.activityInfo.packageName)
                map.putString("appName", resolveInfo.loadLabel(reactApplicationContext.packageManager).toString())
                result.pushMap(map)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setAsDefaultDialer(packageName: String, promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val roleManager = reactApplicationContext.getSystemService(Context.ROLE_SERVICE) as RoleManager
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
                val activity = currentActivity as? Activity
                if (activity != null) {
                    activity.startActivityForResult(intent, 42)  // El código 42 es arbitrario
                    promise.resolve("ROLE_REQUEST_LAUNCHED")
                } else {
                    promise.reject("ERROR", "No se pudo obtener la actividad actual")
                }
            } else {
                // Para versiones anteriores a Android 10
                val intent = Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER)
                intent.putExtra(TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, packageName)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
                promise.resolve("ROLE_REQUEST_LAUNCHED")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}

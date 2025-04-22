package com.callblocking.callblock

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log
import androidx.preference.PreferenceManager

class CallScreener : CallScreeningService() {
    companion object {
        private const val TAG = "CallScreener"
    }

    private fun getBlockedNumbers(): Set<String> {
        val prefs = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        return prefs.getStringSet(PreferenceKeys.BLOCKED_NUMBERS, HashSet()) ?: HashSet()
    }

    override fun onScreenCall(callDetails: Call.Details) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            // No se admite en versiones inferiores a Android 9
            return
        }

        val sharedPreferences = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        val isEnabled = sharedPreferences.getBoolean(PreferenceKeys.BLOCKING_ENABLED, false)
        
        if (!isEnabled) {
            respondToCall(callDetails, CallResponse.Builder().build())
            return
        }

        val blockedNumbers = sharedPreferences.getStringSet(PreferenceKeys.BLOCKED_NUMBERS, emptySet()) ?: emptySet()
        val phoneNumber = callDetails.handle?.schemeSpecificPart

        if (phoneNumber != null && blockedNumbers.contains(phoneNumber)) {
            respondToCall(
                callDetails,
                CallResponse.Builder()
                    .setDisallowCall(true)
                    .setRejectCall(true)
                    .setSkipCallLog(true)
                    .setSkipNotification(true)
                    .build()
            )
        } else {
            respondToCall(callDetails, CallResponse.Builder().build())
        }
    }
}

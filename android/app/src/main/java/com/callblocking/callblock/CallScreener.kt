package com.callblocking.callblock

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log
import android.preference.PreferenceManager

class CallScreener : CallScreeningService() {
    companion object {
        private const val TAG = "CallScreener"
        private const val BLOCKED_NUMBERS_KEY = "blocked_numbers"
    }

    private fun getBlockedNumbers(): Set<String> {
        val prefs = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        return prefs.getStringSet(BLOCKED_NUMBERS_KEY, HashSet()) ?: HashSet()
    }

    override fun onScreenCall(callDetails: Call.Details) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            // No se admite en versiones inferiores a Android 9
            return
        }

        val phoneNumber = callDetails.handle
        if (phoneNumber == null || phoneNumber.scheme != "tel") {
            respondToCall(callDetails, CallResponse.Builder().build())
            return
        }

        val incomingNumber = phoneNumber.schemeSpecificPart
        Log.d(TAG, "Llamada entrante de: $incomingNumber")

        val shouldBlock = getBlockedNumbers().contains(incomingNumber)
        val responseBuilder = CallResponse.Builder()

        if (shouldBlock) {
            responseBuilder.setDisallowCall(true)
                .setRejectCall(true)
                .setSkipCallLog(true)
                .setSkipNotification(true)
            Log.d(TAG, "Bloqueando llamada de: $incomingNumber")
        } else {
            responseBuilder.setDisallowCall(false)
                .setRejectCall(false)
            Log.d(TAG, "Permitiendo llamada de: $incomingNumber")
        }

        respondToCall(callDetails, responseBuilder.build())
    }
}

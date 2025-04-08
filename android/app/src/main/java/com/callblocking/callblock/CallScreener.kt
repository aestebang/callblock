package com.tuapp.callblock

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.net.Uri
import android.util.Log
import android.annotation.TargetApi
import android.preference.PreferenceManager

@TargetApi(Build.VERSION_CODES.P)
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
        val phoneNumber = callDetails.handle
        
        if (phoneNumber == null || phoneNumber.scheme != "tel") {
            // No es una llamada telefónica o no tiene número
            respondToCall(callDetails, CallResponse.Builder().build())
            return
        }
        
        val incomingNumber = phoneNumber.schemeSpecificPart
        Log.d(TAG, "Llamada entrante de: $incomingNumber")
        
        // Comprobar si el número está en la lista de bloqueados
        val shouldBlock = getBlockedNumbers().contains(incomingNumber)
        
        val responseBuilder = CallResponse.Builder()
        
        if (shouldBlock) {
            // Rechazar la llamada
            responseBuilder.setDisallowCall(true)
                           .setRejectCall(true)
                           .setSkipCallLog(true)
                           .setSkipNotification(true)
            Log.d(TAG, "Bloqueando llamada de: $incomingNumber")
        } else {
            // Permitir la llamada
            responseBuilder.setDisallowCall(false)
                           .setRejectCall(false)
            Log.d(TAG, "Permitiendo llamada de: $incomingNumber")
        }
        
        respondToCall(callDetails, responseBuilder.build())
    }
}
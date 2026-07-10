package com.ptdt.dialer.agent

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import io.wazo.callkeep.RNCallKeepModule
import java.util.UUID

/**
 * Handles data-only high-priority FCM pushes from the backend and hands the
 * incoming-call UI to CallKeep BEFORE JS may be alive. Notification payloads
 * are intentionally not used — CallKeep renders the incoming screen.
 */
class IncomingCallReceiver : FirebaseMessagingService() {
  override fun onMessageReceived(msg: RemoteMessage) {
    val data = msg.data
    if (data["type"] != "incoming_call") return

    val from = data["from"] ?: "Unknown"
    val uuid = UUID.randomUUID().toString()
    val extras = HashMap<String, Any>().apply {
      put("callerName", from)
      put("handle", from)
      put("hasVideo", false)
    }
    try {
      RNCallKeepModule.registerPhoneAccount(applicationContext)
      RNCallKeepModule.displayIncomingCall(uuid, from, from, "number", false, extras)
    } catch (e: Throwable) {
      Log.w("PTDT", "displayIncomingCall failed: ${e.message}")
    }
  }

  override fun onNewToken(token: String) {
    // JS-side onTokenRefresh handles backend registration; no-op here.
  }
}

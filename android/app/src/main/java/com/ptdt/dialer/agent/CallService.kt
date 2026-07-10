package com.ptdt.dialer.agent

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Foreground service kept alive during active calls so the OS does not kill
 * the SIP socket. CallKeep's own foreground service handles the primary
 * notification; this exists for extra headroom on aggressive OEMs.
 */
class CallService : Service() {
  companion object {
    const val CHANNEL_ID = "com.ptdt.dialer.agent.calls"
    const val NOTIF_ID = 4243
    fun start(ctx: Context) = ctx.startForegroundService(Intent(ctx, CallService::class.java))
    fun stop(ctx: Context) = ctx.stopService(Intent(ctx, CallService::class.java))
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val ch = NotificationChannel(CHANNEL_ID, "Active Calls", NotificationManager.IMPORTANCE_LOW)
      (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
        .createNotificationChannel(ch)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val n: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("PTDT Agent")
      .setContentText("Call session active")
      .setSmallIcon(android.R.drawable.stat_sys_phone_call)
      .setOngoing(true)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL)
    } else {
      startForeground(NOTIF_ID, n)
    }
    return START_STICKY
  }
}

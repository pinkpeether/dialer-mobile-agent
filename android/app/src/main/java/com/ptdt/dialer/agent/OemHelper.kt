package com.ptdt.dialer.agent

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.*

/**
 * Opens vendor-specific autostart / background-management settings pages,
 * reports device manufacturer info, and manages battery-optimization exemption.
 */
class OemHelper(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName() = "OemHelper"

  private val aggressiveVendors = setOf(
    "xiaomi", "redmi", "poco",
    "oppo", "realme", "oneplus",
    "vivo", "iqoo",
    "huawei", "honor",
    "meizu", "letv"
  )

  private val autostartIntents = listOf(
    // Xiaomi / Redmi / Poco
    ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"),
    // Oppo / Realme
    ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
    ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"),
    ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"),
    // Vivo / iQOO
    ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"),
    // Huawei / Honor
    ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"),
    ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"),
    // OnePlus
    ComponentName("com.oneplus.security", "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity"),
    // Letv / Meizu
    ComponentName("com.letv.android.letvsafe", "com.letv.android.letvsafe.AutobootManageActivity"),
    ComponentName("com.meizu.safe", "com.meizu.safe.security.SHOW_APPSEC"),
  )

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getManufacturer(): String = Build.MANUFACTURER ?: "unknown"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isAggressiveOem(): Boolean =
    aggressiveVendors.contains((Build.MANUFACTURER ?: "").lowercase())

  @ReactMethod
  fun isBatteryOptimizationIgnored(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val pm = ctx.getSystemService(PowerManager::class.java)
        promise.resolve(pm?.isIgnoringBatteryOptimizations(ctx.packageName) == true)
      } else {
        promise.resolve(true)
      }
    } catch (e: Exception) {
      promise.reject("BATT_OPT_QUERY_FAILED", e)
    }
  }

  @ReactMethod
  fun openAutostartSettings(promise: Promise) {
    val pm = ctx.packageManager
    for (comp in autostartIntents) {
      val intent = Intent().apply {
        component = comp
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      if (intent.resolveActivity(pm) != null) {
        try {
          ctx.startActivity(intent)
          promise.resolve(true)
          return
        } catch (_: Exception) { /* try next */ }
      }
    }
    // Fallback: app details page
    try {
      val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.parse("package:${ctx.packageName}")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      ctx.startActivity(fallback)
      promise.resolve(false)
    } catch (e: Exception) {
      promise.reject("OEM_HELPER_FAILED", e)
    }
  }

  @ReactMethod
  fun openBatteryOptimizationSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val pm = ctx.getSystemService(PowerManager::class.java)
        val ignoring = pm?.isIgnoringBatteryOptimizations(ctx.packageName) == true
        val intent = Intent(
          if (ignoring) Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS
          else Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
        ).apply {
          if (!ignoring) data = Uri.parse("package:${ctx.packageName}")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        ctx.startActivity(intent)
        promise.resolve(true)
      } else {
        promise.resolve(false)
      }
    } catch (e: Exception) {
      promise.reject("BATT_OPT_FAILED", e)
    }
  }
}

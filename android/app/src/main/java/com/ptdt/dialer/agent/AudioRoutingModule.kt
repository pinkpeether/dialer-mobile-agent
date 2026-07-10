package com.ptdt.dialer.agent

import android.content.Context
import android.media.AudioManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Thin bridge over AudioManager for earpiece/speaker/BT toggling. JS uses
 * InCallManager for the common paths; this exists for BT-SCO edge cases.
 */
class AudioRoutingModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AudioRouting"

  private fun am(): AudioManager =
    reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  @ReactMethod fun setInCallMode() {
    am().mode = AudioManager.MODE_IN_COMMUNICATION
  }
  @ReactMethod fun setNormalMode() { am().mode = AudioManager.MODE_NORMAL }
  @ReactMethod fun setSpeaker(on: Boolean) { am().isSpeakerphoneOn = on }
  @ReactMethod fun startBluetoothSco() {
    am().startBluetoothSco(); am().isBluetoothScoOn = true
  }
  @ReactMethod fun stopBluetoothSco() {
    am().isBluetoothScoOn = false; am().stopBluetoothSco()
  }
}

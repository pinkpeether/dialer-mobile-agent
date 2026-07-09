/**
 * CallKeep ↔ SipClient bridge.
 * Owns the ConnectionService integration so incoming calls render on the
 * lock screen even when the app was killed (woken by FCM data push).
 */
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import { sipClient } from './SipClient';

export async function setupCallKeep() {
  await RNCallKeep.setup({
    ios: { appName: 'PTDT Agent' },
    android: {
      alertTitle: 'Permissions required',
      alertDescription: 'PTDT Agent needs phone-account access to handle calls',
      cancelButton: 'Cancel',
      okButton: 'OK',
      additionalPermissions: [],
      selfManaged: false,
      foregroundService: {
        channelId: 'com.ptdt.dialer.agent.call',
        channelName: 'Active call',
        notificationTitle: 'PTDT Agent — on a call',
      },
    },
  });
  RNCallKeep.setAvailable(true);

  RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
    sipClient.answer();
    InCallManager.start({ media: 'audio' });
    RNCallKeep.setCurrentCallActive(callUUID);
  });

  RNCallKeep.addEventListener('endCall', () => {
    sipClient.hangup();
    InCallManager.stop();
  });

  RNCallKeep.addEventListener('didPerformDTMFAction', ({ digits }) => {
    if (digits) sipClient.dtmf(digits);
  });

  RNCallKeep.addEventListener('didToggleHoldCallAction', ({ hold }) => sipClient.hold(!!hold));
  RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted }) => sipClient.mute(!!muted));
}

/** Called from IncomingCallReceiver.kt via native → JS bridge on FCM wake. */
export function showIncomingFromPush(uuid: string, from: string, name = 'Caller') {
  RNCallKeep.displayIncomingCall(uuid, from, name, 'number', false);
}

import InCallManager from "react-native-incall-manager";

export const audio = {
  startCall(opts: { speaker?: boolean } = {}) {
    InCallManager.start({ media: "audio" });
    InCallManager.setForceSpeakerphoneOn(!!opts.speaker);
    InCallManager.setKeepScreenOn(true);
  },
  stopCall() {
    InCallManager.stop();
    InCallManager.setKeepScreenOn(false);
  },
  toggleSpeaker(on: boolean) {
    InCallManager.setForceSpeakerphoneOn(on);
  },
  setMute(on: boolean) {
    InCallManager.setMicrophoneMute(on);
  },
};

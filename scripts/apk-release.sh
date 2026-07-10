#!/usr/bin/env bash
# Builds a signed release APK for sideload distribution.
# Requires android/keystore.properties (see keystore.properties.example) and a
# JDK 17+ with ANDROID_HOME set. Output: android/app/build/outputs/apk/release/
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -d android ]; then
  echo "Run scripts/bootstrap.sh first to generate the android/ shell." >&2
  exit 1
fi
if [ ! -f android/keystore.properties ]; then
  echo "Missing android/keystore.properties (copy from .example and fill in)." >&2
  exit 1
fi
pushd android >/dev/null
./gradlew --no-daemon clean assembleRelease
popd >/dev/null
APK=android/app/build/outputs/apk/release/app-release.apk
SHA=$(shasum -a 256 "$APK" | awk '{print $1}')
echo "APK:  $APK"
echo "SHA-256: $SHA"

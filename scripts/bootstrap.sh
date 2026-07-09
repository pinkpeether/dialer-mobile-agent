#!/usr/bin/env bash
# Generates the RN native Android shell into this repo.
# Run once after `git clone`.
set -euo pipefail

if [ -d "android" ]; then
  echo "android/ already exists — refusing to overwrite. Delete it first if you really want to regen."
  exit 1
fi

TMP=$(mktemp -d)
echo "→ Generating RN skeleton in $TMP ..."
npx --yes @react-native-community/cli@latest init DialerMobileAgent \
  --directory "$TMP/app" \
  --version 0.76.5 \
  --skip-install \
  --skip-git-init

echo "→ Copying android/, index.js, app.json, babel.config.js, metro.config.js ..."
cp -r "$TMP/app/android" ./android
cp    "$TMP/app/index.js" ./
cp    "$TMP/app/app.json" ./
cp    "$TMP/app/babel.config.js" ./
cp    "$TMP/app/metro.config.js" ./

echo "→ Patching applicationId → com.ptdt.dialer.agent"
sed -i.bak 's/com\.dialermobileagent/com.ptdt.dialer.agent/g' \
  android/app/build.gradle \
  android/app/src/main/AndroidManifest.xml \
  android/app/src/main/java/com/dialermobileagent/MainActivity.kt \
  android/app/src/main/java/com/dialermobileagent/MainApplication.kt 2>/dev/null || true

echo "→ Adding required Android permissions"
python3 scripts/patch-manifest.py android/app/src/main/AndroidManifest.xml

cat > android/keystore.properties.example <<'K'
MYAPP_UPLOAD_STORE_FILE=ptdt-agent.jks
MYAPP_UPLOAD_KEY_ALIAS=ptdt-agent
MYAPP_UPLOAD_STORE_PASSWORD=change-me
MYAPP_UPLOAD_KEY_PASSWORD=change-me
K

echo ""
echo "✔ Bootstrap complete. Next:"
echo "  1. bun install"
echo "  2. cp .env.example .env  (fill in values)"
echo "  3. Put android/app/google-services.json (from Firebase)"
echo "  4. bun run android"

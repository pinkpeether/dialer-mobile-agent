#!/usr/bin/env python3
"""Inject PTDT Agent app permissions into AndroidManifest.xml (idempotent)."""
import sys, re, pathlib
PERMS = [
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.RECORD_AUDIO",
    "android.permission.MODIFY_AUDIO_SETTINGS",
    "android.permission.BLUETOOTH_CONNECT",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.READ_PHONE_STATE",
    "android.permission.READ_PHONE_NUMBERS",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.FOREGROUND_SERVICE_PHONE_CALL",
    "android.permission.USE_FULL_SCREEN_INTENT",
    "android.permission.WAKE_LOCK",
    "android.permission.VIBRATE",
]
p = pathlib.Path(sys.argv[1])
xml = p.read_text()
inject = []
for perm in PERMS:
    if perm not in xml:
        inject.append(f'    <uses-permission android:name="{perm}" />')
if inject:
    xml = re.sub(r'(<manifest[^>]*>)', r'\1\n' + "\n".join(inject), xml, count=1)
    p.write_text(xml)
    print(f"added {len(inject)} permissions")
else:
    print("all permissions already present")

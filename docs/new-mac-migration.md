# New-Mac migration — Android signing & local secrets

Context: after moving the `plateful` repo to a new Mac, Google Sign-In on the
Android emulator fails with:

```
Google Sign-In failed
androidx.credentials.exceptions.GetCredentialCancellationException: [16] Account reauth failed.
```

`[16]` is `CommonStatusCodes.CANCELED` surfaced by Credential Manager. Root
cause: the new Mac generated a **fresh `~/.android/debug.keystore`**, so the app
is now signed with a SHA-1 that isn't registered as an Android OAuth client in
the Google Cloud project. "Sign in with Google" (via `@capgo/capacitor-social-login`
+ Credential Manager) requires the app's **package + SHA-1** to be registered in
the same project as `VITE_GOOGLE_WEB_CLIENT_ID`, so Google refuses and it looks
like a reauth cancellation.

There is **no custom signing config** in `android/app/build.gradle` (no
`signingConfigs`, no release `signingConfig`), so:
- Debug builds are signed with `~/.android/debug.keystore`.
- Release builds are signed with a keystore you pick manually in Android Studio's
  "Generate Signed Bundle/APK" dialog — a standalone file that lives only on the
  old Mac and is **not** in the repo.

This Mac's debug SHA-1 (the one that is NOT registered):

```
SHA1:   C6:BD:D4:19:DD:0F:AF:2C:16:28:72:3C:9D:8E:35:00:54:63:E1:DD
SHA256: B7:22:A0:56:C8:07:C7:61:B8:22:AE:D6:67:6C:A0:BD:CF:3E:EE:52:20:64:2C:D5:02:C6:48:63:83:F8:F5:92
```

---

## A. Fix the sign-in — copy the old debug keystore (fastest, no cloud changes)

### On the OLD Mac
1. Confirm the file exists:
   ```
   ls -la ~/.android/debug.keystore
   ```
2. AirDrop `~/.android/debug.keystore` to the new Mac (Finder → `Cmd+Shift+G` →
   `~/.android` → select `debug.keystore` → Share → AirDrop). It lands in
   `~/Downloads` on the new Mac.

### On the NEW Mac
3. Back up this Mac's keystore, install the old one, verify, and clear the app:
   ```
   cp ~/.android/debug.keystore ~/.android/debug.keystore.thismac-bak
   cp ~/Downloads/debug.keystore ~/.android/debug.keystore

   /Applications/Android\ Studio.app/Contents/jbr/Contents/Home/bin/keytool -list -v \
     -keystore ~/.android/debug.keystore -alias androiddebugkey \
     -storepass android -keypass android | grep SHA1

   ~/Library/Android/sdk/platform-tools/adb uninstall com.kblanks.plateful
   ```
   The printed SHA-1 should now be **different** from `C6:BD:D4:…:E1:DD` (it's the
   old, registered one).
4. Rebuild/run from Android Studio (or `npx cap run android`). Sign-in works.

### Alternative to A (if the old keystore is gone)
Register this Mac's SHA-1 instead of copying:
Google Cloud Console → APIs & Services → Credentials (the project that owns
`VITE_GOOGLE_WEB_CLIENT_ID`) → open/create the **Android** OAuth client for
`com.kblanks.plateful` → add SHA-1 `C6:BD:D4:19:DD:0F:AF:2C:16:28:72:3C:9D:8E:35:00:54:63:E1:DD`
→ save, wait ~5 min → `adb uninstall com.kblanks.plateful` → reinstall.

If sign-in still fails after a matched SHA-1, clear the emulator's stale Google
token: `adb shell pm clear com.google.android.gms`, then re-add the account.

---

## B. Rescue the RELEASE / UPLOAD keystore (irreplaceable — do this now)

The app is being shipped (`versionCode 26`, `0.0.26`). The release keystore is a
standalone file selected in Android Studio's signing dialog, only on the old Mac.
If that Mac dies and Play App Signing isn't enabled, a lost key means you can
**never update the published app** again.

### On the OLD Mac
1. Find it (excludes the debug keystore):
   ```
   find ~ -name "*.jks" -o -name "*.keystore" 2>/dev/null | grep -v "\.android/debug.keystore"
   ```
   Typically in your home folder, `~/keystores/`, or Desktop.
2. AirDrop that `.jks`/`.keystore` file to the new Mac and store a copy in a
   **password manager / encrypted backup**.
3. Record (these are NOT stored in any file):
   - keystore password
   - key alias
   - key password

   Without them the keystore is useless. If you don't remember them, check
   whether **Play App Signing** is enabled (Play Console → your app → Setup → App
   integrity). If so, a lost **upload** key can be reset via Google; the app
   signing key itself is Google-held and safe.

---

## C. Other machine-local bits (not in git)

- **`.env`** (repo root) — already present and complete on the new Mac (Supabase,
  Google client IDs, PostHog, OpenRouter). Optional: `diff` the old Mac's `.env`
  against the new one in case the old is newer.
- **`recipe-extractor/.env`** — not on the new Mac. Only needed to run the
  extractor **locally** (production runs on Hetzner/Coolify). Grab it if you'll
  run it locally.
- **iOS `plateful/Core/DevConfig.swift`** — already present on the new Mac.
- **AVDs / Android SDK** — recreate locally (the `Pixel_10` emulator already
  exists here). Nothing to copy.

Everything else lives in git.

---

## D. Prevent this recurring (optional, recommended)

Make the debug SHA-1 stable across machines so you only register it once:
1. Commit a shared `debug.keystore` into the repo (or a secure shared location).
2. Add a `signingConfigs.debug` in `android/app/build.gradle` pointing at it and
   set `buildTypes.debug.signingConfig signingConfigs.debug`.

Then any machine builds debug with the same SHA-1, and Google Sign-In keeps
working without per-machine registration.

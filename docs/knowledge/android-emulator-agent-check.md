# Checking a build in the Android emulator as an agent

_Since 2026-11-15 an agent can build the debug APK from `main`, run it on the `Pixel_10` AVD and sign in as `dev@plateful.test` without the dev server, by writing a password-grant session into the WebView's localStorage over Chrome DevTools._

Build. The Mac has no system Java, so Gradle runs on Android Studio's runtime: `npm run build && npx cap sync android && cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug` (Gradle 33 s with a warm cache on 2026-11-15; the APK is `android/app/build/outputs/apk/debug/app-debug.apk`). `adb` and `emulator` live in `~/Library/Android/sdk/platform-tools` and `emulator`, not on `PATH`.

Sign-in. A `dist/` build has no Dev-Login ([dev-login.md](dev-login.md)), and magic link and Google cannot be completed by an agent. The debug build exposes the WebView socket `webview_devtools_remote_<pid>`: `adb forward tcp:9333 localabstract:webview_devtools_remote_$(adb shell pidof com.kblanks.plateful)`, then `Runtime.evaluate` on the page from `http://localhost:9333/json`. Get a session with `POST {VITE_SUPABASE_URL}/auth/v1/token?grant_type=password` using `.env.local`'s `VITE_DEV_EMAIL`/`VITE_DEV_PASSWORD`, check that `user.email` is `dev@plateful.test`, write it to `localStorage["sb-upupcsgufoejppoietiu-auth-token"]` and `location.replace("https://localhost/")`. The WebView origin is `https://localhost`.

Before that, look at what the installed app holds. On 2026-11-15 the emulator's app was signed in with Kerim's own account. `adb exec-out run-as com.kblanks.plateful tar cf - .` backs up its data, `pm clear` empties it, and `adb exec-in run-as com.kblanks.plateful tar xf -` puts it back afterwards. Compare `tar tf` of the backup with a fresh backup after restoring: later that day a restore run right after `pm clear` brought back 1488 of 1616 entries without an error, and a second run completed it. By then the app's files were all 0 bytes (newest mtime 2026-11-05), so it held no session at all. Never launch the app on another account's session.

The AVD's quirks:
- `hw.keyboard=yes` hides the soft keyboard. `adb shell settings put secure show_ime_with_hard_keyboard 1` shows it (set it back to 0 afterwards). With it the WebView resizes (`visualViewport.height` 732 → 453 CSS px).
- The display size is raised to 480 dpi, so the WebView is 360 CSS px wide, not the Pixel's 411. That is a real Android width and catches German labels that overflow.
- The device is `en-US`. `adb shell cmd locale set-app-locales com.kblanks.plateful --locales de-DE` gives the app `de-DE` (also the carb-counting region), but i18next keeps the language it cached on the first start in `localStorage["i18nextLng"]`. Set that to `de` with the session. Reset with `--locales ""`.
- On a fresh boot the Play Store updates Android System WebView within minutes and kills the app (`stop com.google.android.webview due to installPackageLI` in logcat). That is not a crash. Relaunch and forward the new pid's socket.
- `adb shell input text` types ASCII only (`%s` is a space). A tap's device y is `156 + cssY × 3`, the WebView's top offset in device pixels, as long as the status bar is shown.
- WebView `console` output lands in logcat under `Capacitor/Console`. The in-app update check always fails on a sideloaded build (`ERROR_APP_NOT_OWNED`).

The dev account is shared with other sessions (the iOS app's Dev Menu uses it too). Restore by deleting only the ids you created, never by resetting the household's list to a snapshot.

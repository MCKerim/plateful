# Android: R8 im Release-Build (minify + shrink)

**Stand 2026-09-13.** Der Release-Build-Typ in `android/app/build.gradle` läuft mit `minifyEnabled true`, `shrinkResources true` und `proguard-android-optimize.txt`. Vorher war R8 aus (`minifyEnabled false`, `proguard-android.txt`), und die Play Console zeigte unter „App-Optimierung“ die Stufe „Niedrig“ mit 3 % Verschleierung und ohne Optimierungs-/Schwund-Werte.

## Warum

Google Play verlangt ab **Februar 2027** für Apps mit mehr als **10 MB unkomprimiertem DEX** mindestens **25 % Optimierung, 25 % Verschleierung und 25 % Schwund** (jeder Wert einzeln); darunter drohen eingeschränkte Sichtbarkeit und eingeschränktes Veröffentlichen. Plateful 1.1 hatte ohne R8 **39 MB DEX** in der AAB, liegt also klar über der Schwelle. Quelle: Play Console technical quality requirements (support.google.com/googleplay/android-developer/answer/17492799) und der Android-Developers-Blogpost vom August 2026 zu App-Quality-Anforderungen.

## Gotcha: RevenueCats Amazon-Modul schaltet die Optimierung ab

`com.revenuecat.purchases:purchases-store-amazon` (kommt transitiv über `@revenuecat/purchases-capacitor` → `purchases-hybrid-common`) bringt in seinen Consumer-ProGuard-Regeln ein **globales `-dontoptimize`** mit. R8 wendet globale Optionen aus Bibliotheksregeln auf die ganze App an: Die `r8.json` meldete `isOptimizationsEnabled: false` und `noOptimizationPercentage: 100`, Play hätte 0 % Optimierung gesehen und die Anforderung wäre trotz R8 verfehlt. Deshalb steht im Release-Build-Typ:

```groovy
optimization {
    keepRules {
        ignoreFrom 'com.revenuecat.purchases:purchases-store-amazon'
    }
}
```

Damit werden alle Consumer-Regeln dieses einen Artefakts ignoriert (auch `-keep class com.amazon.** {*;}`). Das ist gefahrlos, weil Plateful nur über Google Play verkauft und den Amazon-Store-Pfad nie initialisiert; die `-dontwarn com.amazon.**` bringt das `purchases`-Modul selbst noch einmal mit. AGP 9 filtert solche globalen Optionen aus Bibliotheksregeln von sich aus heraus, AGP 8.13 nicht. Nach einem RevenueCat-Update prüfen, ob die Regel noch nötig ist:

```bash
grep -nE '^-dont(optimize|obfuscate|shrink)' android/app/build/outputs/mapping/release/configuration.txt
```

(`configuration.txt` ist die zusammengeführte R8-Konfiguration; über jeder Sektion steht die Quelldatei.)

## Messen, ohne auf die Play Console zu warten

AGP ≥ 8.10 legt eine `r8.json` in die AAB; Play liest genau diese Werte:

```bash
unzip -p android/app/build/outputs/bundle/release/app-release.aab BUNDLE-METADATA/com.android.tools/r8.json | python3 -m json.tool | grep -A3 '"stats"'
```

Play-Wert = 100 − `no…Percentage`. Stand 1.1 (versionCode 39) mit dieser Konfiguration:

| | ohne R8 | mit R8 |
|---|---|---|
| Optimierung | – | 42,7 % |
| Verschleierung | 3 % (Heuristik) | 43,1 % |
| Schwund | – | 42,9 % |
| DEX unkomprimiert | 39 MB | 10 MB |
| AAB | 29,0 MB | 24,4 MB |

Die Verschleierungsquote bleibt unter 60 %, weil `@capgo/capacitor-social-login` und RevenueCat breite `-keep`-Consumer-Regeln mitbringen (`com.getcapacitor.**`, `okhttp3.**`, `com.revenuecat.**`, `com.google.android.gms.auth.**`). Das sind Bibliotheksregeln, nicht unsere; 25 % sind mit deutlichem Abstand erfüllt.

## Mapping-Datei

AGP legt die Mapping-Datei mit in die AAB (`BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map`), die Play Console de-obfuskiert Crash- und ANR-Stacktraces damit automatisch. Nichts manuell hochladen. Lokal liegt sie unter `android/app/build/outputs/mapping/release/mapping.txt` (nicht eingecheckt, `build/` ist ignoriert).

## Release-Build lokal testen (ohne Release-Keystore)

Der unsignierte Release-APK aus `./gradlew assembleRelease` lässt sich mit dem Debug-Keystore signieren und auf Emulator oder Gerät über einen Debug-Build installieren (gleiche Signatur, App-Daten bleiben erhalten):

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"; export PATH="$JAVA_HOME/bin:$PATH"
BT=~/Library/Android/sdk/build-tools/37.0.0
(cd android && ./gradlew assembleRelease)
$BT/zipalign -p -f 4 android/app/build/outputs/apk/release/app-release-unsigned.apk /tmp/aligned.apk
$BT/apksigner sign --ks ~/.android/debug.keystore --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android --out /tmp/release-debugsigned.apk /tmp/aligned.apk
adb install -r /tmp/release-debugsigned.apk
```

Auf dem Mac gibt es kein `java` im PATH; `apksigner` und Gradle brauchen das JBR aus Android Studio wie oben. Getestet am 2026-09-13 auf dem Pixel-10-AVD (Android 17): Start, Startseite mit Daten, Einstellungen, Planer, Rezeptseite, Rezept-Menü und das native RevenueCat Customer Center (Compose-UI aus `purchases-capacitor-ui`); RevenueCat-Billing-Verbindung und In-App-Update-Check (PlayCore) laufen im Log, keine Exceptions. Nicht geprüft: Google-Login, Kauf, Kamera, Teilen-Sheet, Datumspicker.

## AGP 9

Die Play-Console-Meldung empfiehlt AGP 9.0. Das ist nicht nötig, um die Anforderung zu erfüllen, und derzeit blockiert: Capacitor 8.1 liefert AGP 8.13, und unter AGP 9 bricht jedes Plugin, dessen `build.gradle` noch `proguard-android.txt` referenziert (`@revenuecat/purchases-capacitor` 12.1 tut das). Capacitor 9 (Pre-Release, `@next`) bringt AGP 9.2.1, Gradle 9.5.1, minSdk 26 und compileSdk 37; der Wechsel gehört in ein eigenes Update, nicht in einen Release-Fix.

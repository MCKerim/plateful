# Play Console: die drei „empfohlenen Aktionen“ und was davon in unserer Hand liegt

**Stand 2026-09-13**, geprüft an den Bundles 1.0 und 1.1 (versionCode 39). Keine davon ist eine Anforderung; das Bundle wird angenommen. Die harte Anforderung ist R8 ab Februar 2027, siehe [android-r8.md](android-r8.md).

## „Die randlose Anzeige funktioniert möglicherweise nicht für alle Nutzer“

Play scannt die DEX auf Aufrufe der in API 35 abgekündigten Fenster-APIs (`Window.setStatusBarColor`, `getStatusBarColor`, `setNavigationBarColor`, `FLAG_TRANSLUCENT_STATUS`, `SYSTEM_UI_FLAG_*`, `WindowInsets.getSystemWindowInsetTop`). Bei uns stehen sie ausschließlich in `@capacitor/status-bar` (`StatusBar.java`: `setBackgroundColor`, `setOverlaysWebView`, `getInfo`). Plateful ruft davon nur `StatusBar.setStyle` (Icon-Farbe hell/dunkel in `src/components/general/theme-provider.tsx`), das über `WindowInsetsControllerCompat` läuft und nicht abgekündigt ist. Die Farben der Systemleisten malt `@capawesome/capacitor-android-edge-to-edge-support` mit eigenen Overlay-Views, ebenfalls ohne abgekündigte APIs. R8 entfernt die toten Plugin-Methoden nicht, weil Capacitors Consumer-Regel `-keep public class * extends com.getcapacitor.Plugin { *; }` alle Member hält. Ionic hat das Issue dazu (capacitor-plugins #2517) als „not planned“ geschlossen; 8.0.3 enthält es weiterhin.

Folge für Nutzer: keine. Die Warnung verschwindet nur, wenn `@capacitor/status-bar` aus dem Projekt fliegt. Das ist machbar, weil wir nur `setStyle` nutzen: ein lokales Capacitor-Plugin mit einer Methode, die `WindowCompat.getInsetsController(window, decorView).setAppearanceLightStatusBars(...)` (und `…LightNavigationBars`) setzt, in `MainActivity` registriert. Bewusst noch nicht gemacht: Aufwand für eine reine Konsolen-Kosmetik.

## „Hochladen einer Offenlegungsdatei“ (Mapping)

Kam, weil 1.0 und 1.1 ohne R8 gebaut wurden und Play deshalb keine Mapping-Datei fand. Seit R8 an ist, liegt die Mapping-Datei im Bundle (`BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map`); ab dem nächsten Release erledigt sich der Hinweis von selbst. Nichts hochladen.

## „Dieses App Bundle enthält nativen Code und du hast keine Symbole hochgeladen“

Der einzige native Code im Bundle ist `libandroidx.graphics.path.so` (10 KB je ABI) aus `androidx.graphics:graphics-path`, das Jetpack Compose mitbringt (Compose kommt über RevenueCats Paywall/Customer Center, `purchases-ui`). Wir haben keinen eigenen nativen Code und kein NDK installiert. Die Bibliothek wird von Google bereits gestrippt ausgeliefert: Die ELF-Datei hat nur `.dynsym`, keine `.symtab`- oder `.debug_*`-Sektion. Deshalb kann AGP auch mit `ndk { debugSymbolLevel 'SYMBOL_TABLE' }` nichts extrahieren; getestet am 2026-09-13: der Task `extractReleaseNativeSymbolTables` läuft (auch ohne installiertes NDK) und meldet für alle vier ABIs „Unable to extract native debug metadata … because the native debug metadata has already been stripped“, sein Ausgabeordner bleibt leer, das Bundle bekommt keinen Symbol-Eintrag, die Warnung bliebe. Es gibt nichts hochzuladen; ein Absturz in dieser Bibliothek würde ohnehin mit den exportierten Namen aus `.dynsym` symbolisiert. Warnung ignorieren.

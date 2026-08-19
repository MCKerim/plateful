import i18n from "@/i18n";

/**
 * The language Plateful generates content in for this reader: the recipes an
 * import produces, and the value reported into `users.language`.
 *
 * `i18n.language` is the *detected or set* language, which on a French browser
 * is "fr" even though the UI renders English. `resolvedLanguage` is the one
 * i18next actually resolved against `supportedLngs` in `src/i18n.ts`, so this
 * can only ever return a language we ship a UI for — and it widens on its own
 * the day we add one there.
 *
 * The native counterpart is `ContentLanguage.current` in
 * ~/programming/ios-native/plateful. See that repo's docs/language.md.
 */
export function contentLanguage(): string {
  const resolved = i18n.resolvedLanguage ?? i18n.language;
  return resolved.split("-")[0]; // 'en-US' -> 'en'
}

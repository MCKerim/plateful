import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslation from "./locales/translation.en.json";
import deTranslation from "./locales/translation.de.json";

const isDev = import.meta.env.DEV

i18n
  // detect user language
  .use(LanguageDetector)
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      de: {
        translation: deTranslation,
      },
    },
    debug: isDev, // Enable logging for development
    fallbackLng: "en",
    saveMissing: isDev,
    supportedLngs: ["en", "de"],
    interpolation: {
      escapeValue: false, // react already does escaping
    },
  })

export default i18n;
